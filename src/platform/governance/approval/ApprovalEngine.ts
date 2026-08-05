import { db } from "@/platform/storage/db";
import { ApprovalStatus, ApprovalRequest, ApprovalStep } from "@prisma/client";
import { PlatformEventBus } from '@/platform/events/PlatformEventBus';

export class ApprovalEngine {

  /**
   * Creates a new ApprovalRequest based on an ApprovalChain.
   */
  static async createRequest(chainId: string, entityId: string, requestedBy: string, orgId: string): Promise<ApprovalRequest> {
    const request = await db.approvalRequest.create({
      data: {
        chainId,
        entityId,
        requestedBy,
        currentStep: 1,
        status: "PENDING"
      }
    });

    await PlatformEventBus.emit("APPROVAL_REQUESTED", {
      orgId,
      userId: requestedBy,
      entityType: "APPROVAL_REQUEST",
      entityId: request.id,
      timestamp: new Date()
    });

    return request;
  }

  /**
   * Records a vote for a given request at the current step.
   * Prevents duplicate voting.
   */
  static async submitVote(requestId: string, userId: string, status: "APPROVED" | "REJECTED", comment?: string, orgId?: string) {
    const request = await db.approvalRequest.findUnique({
      where: { id: requestId },
      include: { chain: true }
    });

    if (!request || request.status !== "PENDING") {
      throw new Error("Invalid or resolved approval request.");
    }

    // Upsert to enforce one vote per step per user
    const vote = await db.approvalVote.upsert({
      where: {
        requestId_step_userId: {
          requestId,
          step: request.currentStep,
          userId
        }
      },
      update: {
        status,
        comment
      },
      create: {
        requestId,
        userId,
        step: request.currentStep,
        status,
        comment
      }
    });

    // Evaluate the step after the vote
    await this.evaluateStep(request.id, orgId || request.chain?.organizationId || "");

    return vote;
  }

  /**
   * Evaluates the current step to see if it meets the criteria for advancement or rejection.
   */
  static async evaluateStep(requestId: string, orgId: string) {
    const request = await db.approvalRequest.findUnique({
      where: { id: requestId },
      include: {
        votes: {
          where: { step: { equals: undefined } } // We'll filter below or via query
        }
      }
    });

    if (!request || !request.chainId) return;

    // Fetch step definitions for the current stepOrder
    const currentSteps = await db.approvalStep.findMany({
      where: {
        chainId: request.chainId,
        stepOrder: request.currentStep
      }
    });

    if (currentSteps.length === 0) return;

    // Fetch votes for the current step
    const currentVotes = await db.approvalVote.findMany({
      where: {
        requestId,
        step: request.currentStep
      }
    });

    // If ANY vote is a REJECTION, the entire request is rejected immediately.
    const hasRejection = currentVotes.some(v => v.status === "REJECTED");
    if (hasRejection) {
      await this.resolveRequest(requestId, "REJECTED", orgId);
      return;
    }

    // To advance, ALL parallel steps in this stepOrder must be satisfied.
    // (A parallel group might have `requiredRole: ARCHITECT, minApprovers: 1` 
    // AND another step `requiredRole: SECURITY_LEAD, minApprovers: 2`)
    let allStepsSatisfied = true;

    for (const step of currentSteps) {
      // In a real system, we'd map votes to roles to ensure the *correct* role voted.
      // For now, we simplify by just counting total approvals for the step.
      // To strictly adhere to `requiredRole`, we'd need to verify `userId`'s role matches `step.requiredRole`.
      
      const stepApprovals = currentVotes.filter(v => v.status === "APPROVED"); // Simplification
      
      if (step.approvalStrategy === "FIXED_COUNT") {
        if (stepApprovals.length < step.minApprovers) {
          allStepsSatisfied = false;
          break;
        }
      }
      // Expandable to PERCENTAGE, ALL, etc.
    }

    if (allStepsSatisfied) {
      await this.advanceStep(requestId, orgId);
    }
  }

  /**
   * Advances the request to the next step, or resolves it if it was the final step.
   */
  static async advanceStep(requestId: string, orgId: string) {
    const request = await db.approvalRequest.findUnique({
      where: { id: requestId }
    });

    if (!request || !request.chainId) return;

    // Emit event for step completion
    await PlatformEventBus.emit("APPROVAL_STEP_COMPLETED", {
      orgId,
      userId: request.requestedBy,
      entityType: "APPROVAL_REQUEST",
      entityId: request.id,
      timestamp: new Date(),
      metadata: { step: request.currentStep }
    });

    // Check if there is a next step
    const nextStep = await db.approvalStep.findFirst({
      where: {
        chainId: request.chainId,
        stepOrder: request.currentStep + 1
      }
    });

    if (nextStep) {
      // Advance to next step
      await db.approvalRequest.update({
        where: { id: requestId },
        data: { currentStep: request.currentStep + 1 }
      });
    } else {
      // No more steps, resolve chain as APPROVED
      await this.resolveRequest(requestId, "APPROVED", orgId);
    }
  }

  /**
   * Resolves the request as APPROVED or REJECTED.
   */
  static async resolveRequest(requestId: string, finalStatus: ApprovalStatus, orgId: string) {
    const request = await db.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: finalStatus,
        resolvedAt: new Date()
      }
    });

    const event = finalStatus === "APPROVED" ? "APPROVAL_COMPLETED" : "APPROVAL_REJECTED";
    
    await PlatformEventBus.emit(event, {
      orgId,
      userId: request.requestedBy, // Ideally the user who made the final vote, but falling back to requester
      entityType: "APPROVAL_REQUEST",
      entityId: request.id,
      timestamp: new Date()
    });
  }
}

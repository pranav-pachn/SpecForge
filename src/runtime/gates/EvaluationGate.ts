import { Agent } from '../interfaces/Agent';
import { AgentRequest } from '../interfaces/AgentRequest';
import { AgentResult } from '../interfaces/AgentResult';
import { ExecutionContext } from '../context/ExecutionContext';
import { MiddlewareContext } from '../context/MiddlewareContext';
import { AgentMiddleware, NextMiddleware } from '../executor/AgentMiddleware';
import { evaluationEngine } from '@/platform/evaluation/EvaluationEngine';
import { evaluationBundleBuilder } from '@/platform/evaluation/context/EvaluationBundleBuilder';
import { AgentPausedError } from './HumanApprovalGate';

import { RepairDiagnoser } from '@/platform/repair/RepairDiagnoser';
import { RepairPlanner } from '@/platform/repair/RepairPlanner';
import { RepairExecutor } from '@/platform/repair/RepairExecutor';
import { MarkdownArtifactAdapter } from '@/platform/repair/adapters/MarkdownArtifactAdapter';
import { RepairPolicy } from '@/platform/repair/RepairPolicy';
import { PlatformEventBus } from '@/platform/events/PlatformEventBus';

export class EvaluationGate implements AgentMiddleware {
  async invoke(
    agent: Agent,
    request: AgentRequest,
    context: ExecutionContext,
    middlewareContext: MiddlewareContext,
    next: NextMiddleware
  ): Promise<AgentResult> {
    
    // 1. Run the agent to generate the artifact
    let result = await next();

    // 2. Extract artifact for evaluation
    let artifactText = "";
    if (typeof result.output === "string") {
      artifactText = result.output;
    } else if (result.output && typeof result.output === "object") {
      artifactText = JSON.stringify(result.output);
    } else {
      return result;
    }

    const capability = agent.id.toUpperCase().replace("AGENT", "").replace("-", "_") as any;
    
    // Evaluate loop
    let currentReport = await this.evaluateArtifact(context.workflowId, capability, artifactText, agent.id);
    const requiredThreshold = 80;
    
    const repairConfig = RepairPolicy.getConfig(agent.id);
    let attempts = 0;

    // Self-Repair Loop
    while ((currentReport.aggregate.overall < requiredThreshold || !currentReport.aggregate.passed) && attempts < repairConfig.maxAttempts) {
      if (currentReport.aggregate.overall < repairConfig.escalationThreshold) {
        console.warn(`[EvaluationGate] Score ${currentReport.aggregate.overall} below escalation threshold ${repairConfig.escalationThreshold}. Escalating.`);
        PlatformEventBus.emit("REPAIR_ESCALATED" as any, {
          timestamp: new Date(),
          entityType: "REPAIR",
          entityId: agent.id,
          workflowId: context.workflowId
        });
        break; // Escalate immediately
      }

      attempts++;
      console.log(`[EvaluationGate] Initiating repair attempt ${attempts}/${repairConfig.maxAttempts} for agent ${agent.id}`);

      PlatformEventBus.emit("REPAIR_STARTED" as any, {
        timestamp: new Date(),
        entityType: "REPAIR",
        entityId: agent.id,
        workflowId: context.workflowId
      });

      // 1. Diagnose
      const diagnosis = RepairDiagnoser.diagnose(currentReport, agent.id);
      
      // 2. Plan
      const plan = RepairPlanner.plan(diagnosis, agent.id);
      if (!plan) {
        console.warn(`[EvaluationGate] No viable repair plan could be formulated.`);
        break; // Cannot repair, break to escalation
      }

      // 3. Execute
      const executor = new RepairExecutor(new MarkdownArtifactAdapter());
      const repairResult = await executor.execute(plan, artifactText, agent.id, context.workflowId);

      // 4. Re-evaluate
      artifactText = repairResult.artifact;
      result = { ...result, output: artifactText as any };
      
      currentReport = await this.evaluateArtifact(context.workflowId, capability as any, artifactText, agent.id);
      
      if (currentReport.aggregate.overall >= requiredThreshold && currentReport.aggregate.passed) {
        console.log(`[EvaluationGate] Repair successful! New score: ${currentReport.aggregate.overall}`);
        break; // Fixed!
      }
    }

    // After loop, check if we still failed
    if (currentReport.aggregate.overall < requiredThreshold || !currentReport.aggregate.passed) {
      throw new AgentPausedError(`Artifact failed evaluation quality gates (Score: ${currentReport.aggregate.overall}, Risk: ${currentReport.aggregate.riskLevel}). Repair attempts exhausted. Review required.`);
    }

    // Save PromptEvolution record
    try {
      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();
      const variant = await prisma.promptVariant.findFirst({
        where: { capability: String(capability), status: "ACTIVE" },
        orderBy: { version: "desc" }
      });

      if (variant) {
        await prisma.promptEvaluation.create({
          data: {
            variantId: variant.id,
            workflowId: context.workflowId,
            overallScore: currentReport.aggregate.overall,
            coverageScore: (currentReport as any).categories?.find((c: any) => c.name === "Coverage")?.score || null,
            architectureScore: (currentReport as any).categories?.find((c: any) => c.name === "Architecture")?.score || null,
            consistencyScore: (currentReport as any).categories?.find((c: any) => c.name === "Consistency")?.score || null,
            securityScore: (currentReport as any).categories?.find((c: any) => c.name === "Security")?.score || null,
            groundingScore: (currentReport as any).categories?.find((c: any) => c.name === "Grounding")?.score || null,
            repairTriggered: attempts > 0,
            repairAttempts: attempts,
            latencyMs: 0, // In a full implementation, read from AIGateway metrics
            promptTokens: 0,
            completionTokens: 0,
            provider: "unknown",
            model: "unknown"
          }
        });
      }
      await prisma.$disconnect();
    } catch (e) {
      console.warn("[EvaluationGate] Failed to log PromptEvaluation:", e);
    }

    // If passed, enrich result metadata
    return {
      ...result,
      metadata: {
        ...result.metadata,
        evaluation: currentReport
      }
    };
  }

  private async evaluateArtifact(workflowId: string, capability: string, artifactText: string, agentId: string) {
    const evalRequest = await evaluationBundleBuilder.build({
      workflowId,
      capability: (capability || "SPECIFICATION") as any,
      artifactText,
      agentId
    });
    return await evaluationEngine.evaluate(evalRequest);
  }
}

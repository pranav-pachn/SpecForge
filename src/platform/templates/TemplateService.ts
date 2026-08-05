import { db } from "@/platform/storage/db";
import { TemplateRegistry } from "./TemplateRegistry";
import { TemplateConfigSchema } from "./TemplateConfig";
import { EntitlementGuard } from "../billing/EntitlementGuard";

export class TemplateService {
  /**
   * Instantiates a new Workflow from a Template.
   */
  static async instantiate(orgId: string, templateName: string, workflowName: string, userId: string, projectId: string, version?: number) {
    // 1. Entitlement check for Templates capability
    await EntitlementGuard.requireCapability(orgId, "templates");

    // 2. Entitlement check for Workflow limits
    await EntitlementGuard.requireUsageAllowance(orgId, "maxWorkflows");

    // 3. Fetch and validate template
    const template = await TemplateRegistry.getTemplate(orgId, templateName, version);
    if (!template) throw new Error(`Template ${templateName} not found.`);

    const configParse = TemplateConfigSchema.safeParse(template.config);
    if (!configParse.success) {
      throw new Error(`Template config is invalid: ${configParse.error.message}`);
    }
    const config = configParse.data;

    // 4. Instantiate Workflow
    // We create the workflow with the stages and defaults defined in the template
    const workflow = await db.workflow.create({
      data: {
        organizationId: orgId,
        name: workflowName,
        projectId: projectId, // Passed as argument
        creatorId: userId,
        status: "PLANNING",
      }
    });

    // 5. Build attached entities (Approval Chains, Policies) based on template config
    if (config.approvals && config.approvals.length > 0) {
      // Create Approval Chain for this workflow
      const chain = await db.approvalChain.create({
        data: {
          organizationId: orgId,
          entityType: "WORKFLOW",
          name: `${templateName} Approval Chain`
        }
      });

      // Create steps
      for (let i = 0; i < config.approvals.length; i++) {
        const step = config.approvals[i];
        await db.approvalStep.create({
          data: {
            chainId: chain.id,
            requiredRole: step.role,
            minApprovers: step.minApprovers,
            stepOrder: i + 1,
            parallelGroup: "A" // Simplified for templates
          }
        });
      }
    }

    return workflow;
  }
}

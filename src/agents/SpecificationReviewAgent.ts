import { Agent } from '@/workflow/engine/Agent';
import { WorkflowContext } from '@/workflow/engine/WorkflowContext';
import { gateway } from '@/ai/gateway/gateway';
import { z } from 'zod';

export const SpecificationReviewSchema = z.object({
  checks: z.array(
    z.object({
      type: z.enum(["REQUIREMENT_COVERAGE", "TEST_COVERAGE", "ASSUMPTION_RISK", "CONSISTENCY"]),
      status: z.enum(["PASSED", "FAILED"]),
      description: z.string()
    })
  )
});

export type SpecificationReviewOutput = z.infer<typeof SpecificationReviewSchema>;

export class SpecificationReviewAgent implements Agent<SpecificationReviewOutput> {
  capability = 'spec_review';
  name = 'Specification Review';

  async execute(ctx: WorkflowContext): Promise<SpecificationReviewOutput> {
    const prompt = `
You are a Staff Software Engineer reviewing a feature specification. You need to act as a strict gatekeeper.

Evaluate the specification strictly against these 4 criteria:
1. REQUIREMENT_COVERAGE: Are all user stories and functional requirements clearly covered?
2. TEST_COVERAGE: Are the functional requirements testable? (Look for clear Acceptance Criteria).
3. ASSUMPTION_RISK: Are technical constraints, external dependencies, edge cases, and risks explicitly named?
4. CONSISTENCY: Is the spec consistent internally? Are success metrics clearly defined?

### Specification
${ctx.artifacts.specification?.markdown || ""}
`;
    
    const { object } = await gateway.executeObject({
      capability: this.capability as any,
      system: "You are a strict engineering reviewer.",
      prompt,
      schema: SpecificationReviewSchema,
    });
    
    return object;
  }
}

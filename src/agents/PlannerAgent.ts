import { Agent } from '@/workflow/engine/Agent';
import { WorkflowContext } from '@/workflow/engine/WorkflowContext';
import { gateway } from '@/ai/gateway/gateway';
import { PlannerOutput, PlannerOutputSchema } from '@/ai/schemas/plannerSchema';
import { PromptRegistry } from '@/ai/prompts/registry';

import { ContextBuilder } from '@/context/knowledge/ContextBuilder';
import { PlanningContext } from '@/context/knowledge/profiles/PlanningContext';

export class PlannerAgent implements Agent<PlannerOutput> {
  capability = 'planning';
  name = 'Planning';

  async execute(ctx: WorkflowContext): Promise<PlannerOutput> {
    let engineeringMemory = "";
    try {
      engineeringMemory = await ContextBuilder.build({
        profile: new PlanningContext(),
        workflowId: ctx.input.workflowId,
        query: ctx.input.rawIdea
      });
    } catch (e) {
      console.warn("ContextBuilder failed (likely embedding provider down), using empty memory.");
    }

    const prompt = `
Create an implementation plan for the following raw idea. 
Be sure to fill out the traceability fields to explain why each feature is necessary.

### Idea
${ctx.input.rawIdea}
`;
    
    const augmentedSystem = await PromptRegistry.plan() + '\n\n' + engineeringMemory;

    try {
      const { object } = await gateway.executeObject({
        capability: this.capability as any,
        system: augmentedSystem,
        prompt,
        schema: PlannerOutputSchema,
      });
      return object;
    } catch (e) {
      console.error("PlannerAgent LLM execution failed, using fallback:", e);
      return {
        intent: ctx.input.rawIdea || "Unspecified idea",
        goals: ["Deliver the core behavior described in the raw idea."],
        features: [
          {
            name: "Core Features",
            description: "Implementation of the core user idea.",
            traceability: {
              derivedFrom: ctx.input.rawIdea || "raw idea",
              reason: "Fallback feature generated due to LLM unavailability.",
              confidence: 50,
              sourceComponent: "User Idea",
            },
          },
        ],
        constraints: [],
        risks: ["LLM unavailable; fallback rule-based implementation plan used."],
      };
    }
  }
}

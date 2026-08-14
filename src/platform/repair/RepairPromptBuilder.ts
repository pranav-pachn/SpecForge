import { RepairPlan } from "./interfaces";

export class RepairPromptBuilder {
  static build(plan: RepairPlan, sectionContent: string): string {
    const findingContext = plan.diagnosis.findings
      .map(f => `- [${f.severity}] ${f.message}`)
      .join("\n");

    let strategyInstruction = "";
    if (plan.strategy === "EXPAND") {
      strategyInstruction = "Expand the following section to comprehensively cover the missing requirements identified below.";
    } else if (plan.strategy === "REWRITE") {
      strategyInstruction = "Rewrite the following section to resolve the contradictions and issues identified below.";
    } else if (plan.strategy === "CONSTRAIN") {
      strategyInstruction = "Modify the following section to strictly adhere to the constraints and security requirements identified below.";
    }

    return `
You are an expert autonomous AI Engineering system. You have been invoked by the Self-Repair Engine to fix a failing section of an artifact.

# TASK
${strategyInstruction}

# ISSUES TO FIX
${findingContext}

# FAILING SECTION CONTENT
\`\`\`markdown
${sectionContent}
\`\`\`

# OUTPUT FORMAT
Return ONLY the repaired markdown content for this section. Do not include introductory text, conversational filler, or enclosing markdown code fences unless they are part of the content itself. 
Maintain the original heading structure of the section if one exists.
`;
  }
}

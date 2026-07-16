import { Task, ExecutionPack, TaskDependency } from "@prisma/client";
import { gateway } from "@/lib/ai/gateway/gateway";
import { PromptRegistry } from "@/lib/ai/prompts/registry";
import { AnalysisCategory, AnalysisIssue, AnalysisResult, computeWeightedScore, Analyzer } from "./analysis-engine";

export interface EngineeringReviewContext {
  workflowId: string;
  versionId: string;
  specContent: string;
  planContent: string;
  tasks: any[];
}

export class EngineeringReviewEngine implements Analyzer<EngineeringReviewContext> {
  async analyze(context: EngineeringReviewContext): Promise<AnalysisResult> {
    const tasksData = JSON.stringify(context.tasks.map(t => ({
      title: t.title,
      description: t.description,
      acceptanceCriteria: t.acceptanceCriteria,
      dependencies: t.dependencies,
      requirements: t.requirements
    })));

    const prompt = `
Please review this artifact chain:

### 1. Specification
${context.specContent}

### 2. Implementation Plan
${context.planContent}

### 3. Tasks
${tasksData}
`;

    const { text } = await gateway.execute({
      capability: "review",
      system: PromptRegistry.engineeringReview(),
      prompt,
    });

    let result;
    try {
      const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
      result = JSON.parse(jsonStr);
    } catch (e) {
      throw new Error("AI generated invalid response format");
    }

    const categories: AnalysisCategory[] = [];
    const issues: AnalysisIssue[] = [];

    const catDefs = [
      { id: 'coverage', title: 'Coverage', emoji: '📋', weight: 30 },
      { id: 'testing', title: 'Testing', emoji: '🧪', weight: 20 },
      { id: 'security', title: 'Security', emoji: '🔒', weight: 20 },
      { id: 'performance', title: 'Performance', emoji: '⚡', weight: 10 },
      { id: 'architecture', title: 'Architecture', emoji: '🏗️', weight: 10 },
      { id: 'deployment', title: 'Deployment', emoji: '🚀', weight: 5 },
      { id: 'rollback', title: 'Rollback', emoji: '↩️', weight: 5 },
    ];

    for (const def of catDefs) {
      const resCat = result[def.id];
      const score = resCat?.score || 0;
      const items = resCat?.items || [];
      
      categories.push({
        ...def,
        score,
        items
      });

      for (const item of items) {
        if (item.status === 'warn' || item.status === 'fail') {
          issues.push({
            severity: item.status === 'fail' ? 'critical' : 'warning',
            category: def.id,
            title: item.label || 'Issue found',
            description: item.detail || ''
          });
        }
      }
    }

    const overallScore = computeWeightedScore(categories);

    return {
      categories,
      overallScore,
      issues,
      generatedAt: new Date(),
    };
  }
}

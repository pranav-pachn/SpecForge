import { Task, ExecutionPack, TaskDependency } from "@prisma/client";
import { gateway } from "@/lib/ai/gateway/gateway";
import { VALIDATION_MISSING_FEATURES_PROMPT, VALIDATION_DUPLICATE_DETECTION_PROMPT } from "@/lib/ai/prompts/validation-prompts";
import { PromptRegistry } from "@/lib/ai/prompts/registry";
import { AnalysisCategory, AnalysisIssue, AnalysisResult, computeWeightedScore } from "./analysis-engine";

export type FullTask = Task & {
  dependencies: TaskDependency[];
  executionPacks: ExecutionPack[];
};

export interface ValidationContext {
  workflowId: string;
  versionId: string;
  specContent: string;
  planContent: string;
  tasks: FullTask[];
  requirements: string[];
}

export class ValidationEngine {
  async analyze(context: ValidationContext): Promise<AnalysisResult> {
    const categories: AnalysisCategory[] = [];
    const issues: AnalysisIssue[] = [];

    // Run parallel AI checks alongside deterministic checks
    const [missingFeatures, duplicates] = await Promise.all([
      this.checkMissingFeaturesAI(context.specContent, context.tasks),
      this.checkDuplicatesAI(context.tasks),
    ]);

    // 1. Requirement Coverage
    const coverage = this.checkRequirementCoverage(context.requirements, context.tasks, missingFeatures);
    categories.push(coverage.category);
    issues.push(...coverage.issues);

    // 3. Task Mapping
    const mapping = this.checkTaskMapping(context.tasks);
    categories.push(mapping.category);
    issues.push(...mapping.issues);

    // 4. Acceptance Criteria
    const acceptance = this.checkAcceptanceCriteria(context.tasks);
    categories.push(acceptance.category);
    issues.push(...acceptance.issues);

    // 5. Execution Packs
    const execution = this.checkExecutionPacks(context.tasks);
    categories.push(execution.category);
    issues.push(...execution.issues);

    // 6 & 7. Dependencies & Circular
    const deps = this.checkDependencies(context.tasks);
    categories.push(deps.category);
    issues.push(...deps.issues);

    // 8. Duplicates (AI results processed)
    const dups = this.processDuplicates(duplicates, context.tasks);
    categories.push(dups.category);
    issues.push(...dups.issues);

    const overallScore = computeWeightedScore([
      { weight: 35, score: coverage.category.score },
      { weight: 20, score: mapping.category.score },
      { weight: 15, score: acceptance.category.score },
      { weight: 15, score: execution.category.score },
      { weight: 10, score: deps.category.score },
      { weight: 5, score: dups.category.score },
    ]);

    return {
      categories,
      overallScore,
      issues,
      generatedAt: new Date(),
    };
  }

  private checkRequirementCoverage(requirements: string[], tasks: FullTask[], missingFeaturesAi: any[]) {
    const items: any[] = [];
    const issues: AnalysisIssue[] = [];
    
    const coveredReqs = new Set(tasks.flatMap(t => t.requirements || []));
    let missedCount = 0;

    for (const req of requirements) {
      if (coveredReqs.has(req)) {
        items.push({ status: 'pass', label: `Requirement Covered: ${req}` });
      } else {
        items.push({ status: 'fail', label: `Missing Requirement: ${req}`, detail: 'No tasks implement this requirement.' });
        issues.push({
          severity: 'critical',
          category: 'coverage',
          title: `Missing Requirement: ${req}`,
          description: 'No tasks implement this requirement.',
          linkedRequirementId: req,
          recommendation: 'Generate a new task to implement this requirement.'
        });
        missedCount++;
      }
    }

    // Add AI identified missing features
    for (const mf of missingFeaturesAi) {
      items.push({ status: 'warn', label: `Missing Feature: ${mf.feature}`, detail: mf.recommendation });
      issues.push({
        severity: 'warning',
        category: 'coverage',
        title: `Missing Feature: ${mf.feature}`,
        description: `Spec Section: ${mf.specSection}`,
        recommendation: mf.recommendation
      });
      missedCount++;
    }

    const total = requirements.length + missingFeaturesAi.length;
    let score = 100;
    if (total > 0) {
      score = Math.round(((total - missedCount) / total) * 100);
    }
    if (total === 0 && missedCount > 0) score = 0; // AI only findings without extracted reqs

    return {
      category: { id: 'coverage', title: 'Requirement Coverage', emoji: '📋', weight: 35, score, items },
      issues
    };
  }

  private checkTaskMapping(tasks: FullTask[]) {
    const items: any[] = [];
    const issues: AnalysisIssue[] = [];
    let orphanCount = 0;

    for (const task of tasks) {
      if (!task.requirements || task.requirements.length === 0) {
        items.push({ status: 'warn', label: `Orphan Task: ${task.title}`, detail: 'Does not map to any requirements.' });
        issues.push({
          severity: 'warning',
          category: 'taskMapping',
          title: 'Orphan Task Found',
          description: `Task "${task.title}" is not mapped to any specification requirements.`,
          linkedTaskId: task.id,
          recommendation: 'Ensure this task is necessary or map it to a requirement.'
        });
        orphanCount++;
      } else {
        items.push({ status: 'pass', label: `Mapped: ${task.title}` });
      }
    }

    const score = tasks.length > 0 ? Math.round(((tasks.length - orphanCount) / tasks.length) * 100) : 100;

    return {
      category: { id: 'taskMapping', title: 'Task Mapping', emoji: '🔗', weight: 20, score, items },
      issues
    };
  }

  private checkAcceptanceCriteria(tasks: FullTask[]) {
    const items: any[] = [];
    const issues: AnalysisIssue[] = [];
    let missingCount = 0;

    for (const task of tasks) {
      if (!task.acceptanceCriteria || task.acceptanceCriteria.trim() === '') {
        items.push({ status: 'fail', label: `Missing AC: ${task.title}`, detail: 'Task has no acceptance criteria.' });
        issues.push({
          severity: 'critical',
          category: 'acceptance',
          title: 'Missing Acceptance Criteria',
          description: `Task "${task.title}" lacks acceptance criteria.`,
          linkedTaskId: task.id,
          recommendation: 'Add clear acceptance criteria.'
        });
        missingCount++;
      } else {
        items.push({ status: 'pass', label: `AC Present: ${task.title}` });
      }
    }

    const score = tasks.length > 0 ? Math.round(((tasks.length - missingCount) / tasks.length) * 100) : 100;

    return {
      category: { id: 'acceptance', title: 'Acceptance Criteria', emoji: '✅', weight: 15, score, items },
      issues
    };
  }

  private checkExecutionPacks(tasks: FullTask[]) {
    const items: any[] = [];
    const issues: AnalysisIssue[] = [];
    let missingCount = 0;

    for (const task of tasks) {
      if (!task.executionPacks || task.executionPacks.length === 0) {
        items.push({ status: 'fail', label: `Missing Pack: ${task.title}`, detail: 'Task has no execution packs.' });
        issues.push({
          severity: 'critical',
          category: 'execution',
          title: 'Missing Execution Pack',
          description: `Task "${task.title}" has no generated execution packs.`,
          linkedTaskId: task.id,
          recommendation: 'Generate an execution pack for this task.'
        });
        missingCount++;
      } else {
        items.push({ status: 'pass', label: `Pack Ready: ${task.title}` });
      }
    }

    const score = tasks.length > 0 ? Math.round(((tasks.length - missingCount) / tasks.length) * 100) : 100;

    return {
      category: { id: 'execution', title: 'Execution Packs', emoji: '📦', weight: 15, score, items },
      issues
    };
  }

  private checkDependencies(tasks: FullTask[]) {
    const items: any[] = [];
    const issues: AnalysisIssue[] = [];
    const taskIds = new Set(tasks.map(t => t.id));
    let errorCount = 0;

    // Build adjacency list for cycle detection
    const graph = new Map<string, string[]>();
    for (const t of tasks) {
      graph.set(t.id, t.dependencies.map(d => d.dependsOnId));
    }

    // 1. Broken dependencies
    for (const task of tasks) {
      for (const dep of task.dependencies) {
        if (!taskIds.has(dep.dependsOnId)) {
          items.push({ status: 'fail', label: `Broken Dependency in ${task.title}` });
          issues.push({
            severity: 'critical',
            category: 'dependency',
            title: 'Broken Dependency',
            description: `Task "${task.title}" depends on a missing task ID.`,
            linkedTaskId: task.id,
          });
          errorCount++;
        }
      }
    }

    // 2. Circular dependencies (DFS)
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const edges = graph.get(nodeId) || [];
      for (const neighbor of edges) {
        if (!visited.has(neighbor) && hasCycle(neighbor)) return true;
        else if (recursionStack.has(neighbor)) return true;
      }
      recursionStack.delete(nodeId);
      return false;
    };

    let cyclesFound = 0;
    for (const taskId of Array.from(taskIds)) {
      if (!visited.has(taskId)) {
        if (hasCycle(taskId)) {
          cyclesFound++;
          const task = tasks.find(t => t.id === taskId);
          items.push({ status: 'fail', label: `Circular Dependency near ${task?.title}` });
          issues.push({
            severity: 'critical',
            category: 'dependency',
            title: 'Circular Dependency',
            description: `A dependency cycle was detected involving task "${task?.title}".`,
            linkedTaskId: taskId,
          });
        }
      }
    }

    errorCount += cyclesFound;
    
    if (errorCount === 0) {
      items.push({ status: 'pass', label: 'All dependencies valid' });
    }

    let score = 100;
    if (errorCount > 0) score = Math.max(0, 100 - (errorCount * 20));

    return {
      category: { id: 'dependency', title: 'Dependencies', emoji: '🕸️', weight: 10, score, items },
      issues
    };
  }

  private processDuplicates(duplicates: any[], tasks: FullTask[]) {
    const items: any[] = [];
    const issues: AnalysisIssue[] = [];
    
    for (const dup of duplicates) {
      const task1 = tasks[dup.taskIndex1];
      const task2 = tasks[dup.taskIndex2];
      if (task1 && task2) {
        items.push({ status: 'warn', label: `Duplicate: ${task1.title} / ${task2.title}`, detail: dup.reason });
        issues.push({
          severity: 'warning',
          category: 'duplicate',
          title: 'Possible Duplicate Tasks',
          description: `"${task1.title}" and "${task2.title}" seem similar. ${dup.reason}`,
          linkedTaskId: task1.id,
          recommendation: 'Review and possibly merge these tasks.'
        });
      }
    }

    if (duplicates.length === 0) {
      items.push({ status: 'pass', label: 'No duplicates detected' });
    }

    let score = 100;
    if (duplicates.length > 0) {
      score = Math.max(0, 100 - (duplicates.length * 15));
    }

    return {
      category: { id: 'duplicate', title: 'Duplicate Detection', emoji: '👯', weight: 5, score, items },
      issues
    };
  }

  private async checkMissingFeaturesAI(specContent: string, tasks: FullTask[]) {
    try {
      const tasksList = tasks.map(t => ({ title: t.title, description: t.description }));
      const prompt = `
### Specification
${specContent}

### Tasks
${JSON.stringify(tasksList, null, 2)}
      `;

      const { text } = await gateway.execute({
      capability: "spec",
      system: PromptRegistry.spec(),
        prompt
      });

      const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
      const res = JSON.parse(jsonStr);
      return res.missingFeatures || [];
    } catch (e) {
      console.error("AI Missing Features Check Failed", e);
      return [];
    }
  }

  private async checkDuplicatesAI(tasks: FullTask[]) {
    if (tasks.length < 2) return [];
    
    try {
      const tasksList = tasks.map((t, i) => ({ index: i, title: t.title, description: t.description }));
      const prompt = JSON.stringify(tasksList, null, 2);

      const { text } = await gateway.execute({
      capability: "spec",
      system: PromptRegistry.spec(),
        prompt
      });

      const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
      const res = JSON.parse(jsonStr);
      return res.duplicates || [];
    } catch (e) {
      console.error("AI Duplicate Check Failed", e);
      return [];
    }
  }
}

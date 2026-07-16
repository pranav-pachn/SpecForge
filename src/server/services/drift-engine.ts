import { db } from "@/lib/db";
import { ArtifactType } from "@prisma/client";
import { gateway } from "@/lib/ai/gateway/gateway";
import { PromptRegistry } from "@/lib/ai/prompts/registry";

/**
 * RequirementDiff structure returned by the diffing engine.
 */
export interface RequirementDiff {
  type: "added" | "modified" | "deleted" | "moved" | "renamed";
  requirementId?: string;
  heading?: string;
  oldText?: string;
  newText?: string;
  description: string;
}

export interface ImpactNode {
  type: "requirement" | "plan_section" | "task" | "execution_pack";
  id: string;
  title: string;
  status: "stale" | "current";
  children: ImpactNode[];
}

export interface ImpactGraph {
  roots: ImpactNode[];
  counts: {
    requirements: number;
    planSections: number;
    tasks: number;
    executionPacks: number;
  };
}

// ----------------------------------------------------------------------
// SUB-MODULE: RequirementDiffer (Hybrid Cascade)
// ----------------------------------------------------------------------

/**
 * Parses markdown into sections keyed by heading.
 */
function parseMarkdownSections(markdown: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = markdown.split("\n");
  
  let currentHeading = "Overview";
  let currentContent: string[] = [];

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (match) {
      if (currentContent.length > 0) {
        sections[currentHeading] = currentContent.join("\n").trim();
      }
      currentHeading = match[2].trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  if (currentContent.length > 0) {
    sections[currentHeading] = currentContent.join("\n").trim();
  }

  return sections;
}

/**
 * Computes Levenshtein distance for fuzzy string matching.
 */
function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
  }
  return matrix[a.length][b.length];
}

/**
 * Computes a string similarity ratio (0 to 1).
 */
function stringSimilarity(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) return 1;
  const distance = levenshtein(a.toLowerCase(), b.toLowerCase());
  return 1 - distance / Math.max(a.length, b.length);
}

/**
 * Compares two spec versions and returns structured requirement diffs.
 */
async function computeRequirementDiff(oldContent: string, newContent: string): Promise<RequirementDiff[]> {
  const diffs: RequirementDiff[] = [];

  // Parse sections
  const oldSections = parseMarkdownSections(oldContent);
  const newSections = parseMarkdownSections(newContent);

  // Focus only on Requirements (e.g. Functional Requirements, User Stories)
  const isReqSection = (k: string) => k.toLowerCase().includes("requirement") || k.toLowerCase().includes("story");
  
  const oldReqContent = Object.entries(oldSections).filter(([k]) => isReqSection(k)).map(([_, v]) => v).join("\n");
  const newReqContent = Object.entries(newSections).filter(([k]) => isReqSection(k)).map(([_, v]) => v).join("\n");

  // Fallback to AI diff if content lacks clear headings or lists
  const hasStructure = (t: string) => t.includes("###") || /REQ-\d+/.test(t) || /^- /m.test(t);
  
  if (!hasStructure(oldReqContent) || !hasStructure(newReqContent)) {
    return await computeSemanticDiffAI(oldContent, newContent);
  }

  // Level 1: ID Matching (Extract REQ-xxx)
  const extractReqs = (text: string) => {
    const map = new Map<string, string>();
    const regex = /(REQ-\d+)[^]*?(?=(REQ-\d+)|$)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      map.set(match[1], match[0].trim());
    }
    return map;
  };

  const oldReqs = extractReqs(oldReqContent);
  const newReqs = extractReqs(newReqContent);

  if (oldReqs.size > 0 || newReqs.size > 0) {
    // Diff by ID
    for (const [id, oldText] of Array.from(oldReqs.entries())) {
      const newText = newReqs.get(id);
      if (!newText) {
        diffs.push({ type: "deleted", requirementId: id, oldText, description: `Requirement ${id} was deleted.` });
      } else {
        const similarity = stringSimilarity(oldText, newText);
        if (similarity < 0.95) {
          diffs.push({ type: "modified", requirementId: id, oldText, newText, description: `Requirement ${id} was modified.` });
        }
        newReqs.delete(id);
      }
    }
    for (const [id, newText] of Array.from(newReqs.entries())) {
      diffs.push({ type: "added", requirementId: id, newText, description: `Requirement ${id} was added.` });
    }
    return diffs;
  }

  // Level 2: Fuzzy Heading/List Matching
  const extractListItems = (text: string) => {
    return text.split("\n").map(l => l.trim()).filter(l => l.startsWith("-") || l.match(/^\d+\./));
  };
  
  const oldItems = extractListItems(oldReqContent);
  const newItems = extractListItems(newReqContent);

  // If even list items are missing, fallback to AI
  if (oldItems.length === 0 && newItems.length === 0) {
    return await computeSemanticDiffAI(oldContent, newContent);
  }

  // Naive fuzzy match for list items
  const matchedNew = new Set<number>();
  for (const oldItem of oldItems) {
    let bestMatchIdx = -1;
    let bestSimilarity = 0;
    
    for (let i = 0; i < newItems.length; i++) {
      if (matchedNew.has(i)) continue;
      const sim = stringSimilarity(oldItem, newItems[i]);
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        bestMatchIdx = i;
      }
    }

    if (bestMatchIdx !== -1 && bestSimilarity >= 0.7) { // 70% threshold for "modified"
      matchedNew.add(bestMatchIdx);
      if (bestSimilarity < 0.95) { // 95% threshold for "unchanged"
        diffs.push({ type: "modified", oldText: oldItem, newText: newItems[bestMatchIdx], description: `Modified: ${newItems[bestMatchIdx].substring(0, 50)}...` });
      }
    } else {
      diffs.push({ type: "deleted", oldText: oldItem, description: `Deleted: ${oldItem.substring(0, 50)}...` });
    }
  }

  for (let i = 0; i < newItems.length; i++) {
    if (!matchedNew.has(i)) {
      diffs.push({ type: "added", newText: newItems[i], description: `Added: ${newItems[i].substring(0, 50)}...` });
    }
  }

  return diffs;
}

/**
 * Level 3: LLM Semantic Diff Fallback
 */
async function computeSemanticDiffAI(oldContent: string, newContent: string): Promise<RequirementDiff[]> {
  const prompt = `### Old Specification\n${oldContent}\n\n### New Specification\n${newContent}`;
  try {
    const { text } = await gateway.execute({
      capability: "drift",
      system: PromptRegistry.drift(),
      prompt
    });
    
    const parsed = JSON.parse(text);
    return parsed.diffs || [];
  } catch (err) {
    console.error("AI Semantic Diff failed", err);
    return [];
  }
}

// ----------------------------------------------------------------------
// SUB-MODULE: ImpactAnalyzer (O(n) Traversal)
// ----------------------------------------------------------------------

/**
 * Builds an impact graph of downstream artifacts affected by the diffs.
 */
async function buildImpactGraph(workflowId: string, diffs: RequirementDiff[]): Promise<ImpactGraph> {
  const graph: ImpactGraph = {
    roots: [],
    counts: { requirements: 0, planSections: 0, tasks: 0, executionPacks: 0 }
  };

  const changedReqIds = diffs
    .filter(d => (d.type === 'modified' || d.type === 'deleted') && d.requirementId)
    .map(d => d.requirementId!);
    
  const changedText = diffs
    .filter(d => d.type === 'modified' || d.type === 'deleted')
    .map(d => d.oldText || "");

  if (changedReqIds.length === 0 && changedText.length === 0) return graph;

  graph.counts.requirements = diffs.length;

  // 1. Find Tasks impacted by changed requirements (O(n) traversal)
  const allTasks = await db.task.findMany({
    where: { workflowId, status: { not: "DONE" } },
    include: { executionPacks: true }
  });

  const impactedTasks = new Set<string>();
  const impactedPacks = new Set<string>();

  for (const task of allTasks) {
    // Check if task.requirements array contains any of our changedReqIds
    const hasLinkedReqId = task.requirements.some(r => changedReqIds.includes(r));
    
    // Fuzzy check: if the task title or description mentions the old text of a modified/deleted requirement
    const mentionsText = changedText.some(t => t.length > 10 && (task.title.includes(t.substring(0, 20)) || (task.description && task.description.includes(t.substring(0, 20)))));

    if (hasLinkedReqId || mentionsText) {
      impactedTasks.add(task.id);
      graph.counts.tasks++;

      // 2. Find ExecutionPacks for this task
      for (const pack of task.executionPacks) {
        impactedPacks.add(pack.id);
        graph.counts.executionPacks++;
      }
    }
  }

  // Create the roots structure
  for (const diff of diffs) {
    if (diff.type === 'added') continue; // Added requirements don't have downstream artifacts yet

    const reqNode: ImpactNode = {
      type: "requirement",
      id: diff.requirementId || Math.random().toString(36).substring(7),
      title: diff.requirementId || "Modified Requirement",
      status: "stale",
      children: []
    };

    // Attach tasks to this requirement (if matched)
    for (const task of allTasks) {
      if (impactedTasks.has(task.id) && (diff.requirementId && task.requirements.includes(diff.requirementId))) {
        const taskNode: ImpactNode = {
          type: "task",
          id: task.id,
          title: task.title,
          status: "stale",
          children: []
        };
        
        for (const pack of task.executionPacks) {
          taskNode.children.push({
            type: "execution_pack",
            id: pack.id,
            title: `Execution Pack (${pack.toolName})`,
            status: "stale",
            children: []
          });
        }
        
        reqNode.children.push(taskNode);
      }
    }

    graph.roots.push(reqNode);
  }

  return graph;
}

// ----------------------------------------------------------------------
// SUB-MODULE: ArtifactMarker
// ----------------------------------------------------------------------

/**
 * Marks impacted artifacts in the database and creates drift events.
 */
async function markImpactedArtifacts(
  workflowId: string, 
  oldVersionId: string, 
  newVersionId: string, 
  graph: ImpactGraph
) {
  // Mark PLAN as STALE if there is any impact
  const planArtifact = await db.artifact.findFirst({
    where: { workflowId, type: "PLAN" },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } }
  });

  if (planArtifact && planArtifact.versions.length > 0) {
    const planVersion = planArtifact.versions[0];
    if (planVersion.status === "APPROVED" || planVersion.status === "NEEDS_REVIEW") {
      await db.artifactVersion.update({
        where: { id: planVersion.id },
        data: { status: "STALE" }
      });
      
      // Log event for PLAN
      await db.driftEvent.create({
        data: {
          versionId: oldVersionId,
          sourceVersionId: newVersionId,
          entityType: "PLAN",
          entityId: planArtifact.id,
          description: `Specification changed. The implementation plan needs to be updated.`,
          resolved: false
        }
      });
    }
  }

  // Recursive function to mark graph nodes
  async function markNode(node: ImpactNode) {
    if (node.type === "task") {
      await db.driftEvent.create({
        data: {
          versionId: oldVersionId,
          sourceVersionId: newVersionId,
          entityType: "TASK",
          entityId: node.id,
          description: `Upstream specification for this task changed.`,
          resolved: false
        }
      });
    } else if (node.type === "execution_pack") {
      await db.driftEvent.create({
        data: {
          versionId: oldVersionId,
          sourceVersionId: newVersionId,
          entityType: "PACK",
          entityId: node.id,
          description: `Upstream specification for this execution pack changed.`,
          resolved: false
        }
      });
    }

    for (const child of node.children) {
      await markNode(child);
    }
  }

  for (const root of graph.roots) {
    for (const child of root.children) {
      await markNode(child);
    }
  }
}

// ----------------------------------------------------------------------
// MAIN DRIFT ORCHESTRATOR
// ----------------------------------------------------------------------

/**
 * Handles identifying and marking downstream artifacts as STALE 
 * when an upstream artifact (like SPEC or PLAN) is updated.
 */
export async function handleArtifactDrift(
  workflowId: string, 
  updatedArtifactType: ArtifactType, 
  oldVersionId: string, 
  newVersionId: string
) {
  // We only run full Drift Analysis on SPEC updates for now
  if (updatedArtifactType === "SPEC") {
    
    // 1. Fetch versions (VersionComparer)
    const oldVersion = await db.artifactVersion.findUnique({ where: { id: oldVersionId } });
    const newVersion = await db.artifactVersion.findUnique({ where: { id: newVersionId } });
    
    if (!oldVersion || !newVersion) return;

    // 2. Diff Requirements
    const diffs = await computeRequirementDiff(oldVersion.content, newVersion.content);

    // 3. Impact Analysis
    const impactGraph = await buildImpactGraph(workflowId, diffs);

    // 4. Create DriftAnalysis Record
    const driftAnalysis = await db.driftAnalysis.create({
      data: {
        workflowId,
        oldVersionId,
        newVersionId,
        diffData: JSON.stringify(diffs),
        impactData: JSON.stringify(impactGraph),
        summary: JSON.stringify({
          changedRequirements: diffs.length,
          impactedTasks: impactGraph.counts.tasks,
          impactedPacks: impactGraph.counts.executionPacks
        }),
        status: "DETECTED"
      }
    });

    // 5. Mark Artifacts (and log DriftEvents)
    if (diffs.length > 0) {
      await markImpactedArtifacts(workflowId, oldVersionId, newVersionId, impactGraph);
    }

    // Also mark old validations as stale
    const validationReports = await db.validationReport.findMany({
      where: { versionId: oldVersionId }
    });

    for (const v of validationReports) {
      await db.driftEvent.create({
        data: {
          versionId: oldVersionId, 
          sourceVersionId: newVersionId,
          entityType: "VALIDATION",
          entityId: v.id,
          description: "Specification was updated. This validation report may be stale.",
          resolved: false
        }
      });
    }
    
    return driftAnalysis;
  }
}

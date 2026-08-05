import { GraphNode, NodeType } from "../graph/NodeTypes";

export interface RegenerationAction {
  agentName: string;
  capability: string;
  affectedNodes: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
  description: string;
}

export class RegenerationPlanner {
  
  /**
   * Generates a plan of which AI agents need to re-run based on the stale nodes in the graph.
   */
  static plan(staleNodes: GraphNode[]): RegenerationAction[] {
    const actions: RegenerationAction[] = [];
    
    const counts = {
      [NodeType.ARCHITECTURE]: 0,
      [NodeType.TASK]: 0,
      [NodeType.TEST]: 0,
      [NodeType.FILE]: 0,
      [NodeType.REVIEW]: 0
    };

    staleNodes.forEach(node => {
      if (counts[node.type as keyof typeof counts] !== undefined) {
        counts[node.type as keyof typeof counts]++;
      }
    });

    if (counts[NodeType.ARCHITECTURE] > 0) {
      actions.push({
        agentName: "ArchitectAgent",
        capability: "architecture",
        affectedNodes: counts[NodeType.ARCHITECTURE],
        priority: "HIGH",
        description: `Regenerate architecture to align with upstream changes.`
      });
    }

    if (counts[NodeType.TASK] > 0) {
      actions.push({
        agentName: "TaskPlannerAgent",
        capability: "planning",
        affectedNodes: counts[NodeType.TASK],
        priority: "MEDIUM",
        description: `Update tasks and execution plans.`
      });
    }

    if (counts[NodeType.TEST] > 0 || counts[NodeType.REVIEW] > 0) {
      actions.push({
        agentName: "ReviewerAgent",
        capability: "review",
        affectedNodes: counts[NodeType.TEST] + counts[NodeType.REVIEW],
        priority: "LOW",
        description: `Re-run specification checks and validation.`
      });
    }

    return actions;
  }
}

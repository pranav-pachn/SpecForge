import { GraphService } from "../graph/GraphService";
import { GraphNode, NodeType, EdgeType } from "../graph/NodeTypes";

export interface CoverageReport {
  totalRequirements: number;
  coveredRequirements: number;
  fulfillmentPercentage: number;
  uncoveredNodes: GraphNode[];
  traceabilityMap: Record<string, { tasks: GraphNode[], tests: GraphNode[] }>;
}

export class CoverageEngine {
  
  /**
   * Calculates the requirement fulfillment coverage.
   * Every REQUIREMENT node should trace to at least one TASK and/or TEST.
   */
  static async calculateCoverage(workflowId: string): Promise<CoverageReport> {
    const nodes = await GraphService.getWorkflowNodes(workflowId);
    const edges = await GraphService.getWorkflowEdges(workflowId);

    const requirements = nodes.filter(n => n.type === NodeType.REQUIREMENT);
    const tasks = nodes.filter(n => n.type === NodeType.TASK);
    const tests = nodes.filter(n => n.type === NodeType.TEST);

    const report: CoverageReport = {
      totalRequirements: requirements.length,
      coveredRequirements: 0,
      fulfillmentPercentage: 0,
      uncoveredNodes: [],
      traceabilityMap: {}
    };

    if (requirements.length === 0) return report;

    // Build adjacency for tracing
    const targetToSources = new Map<string, string[]>();
    edges.forEach(e => {
      // In a trace, typically tasks/tests (source) RELATE_TO or IMPLEMENT a requirement (target)
      // Or requirements (source) are implemented by tasks (target).
      // Based on GraphBuilder, edges are usually child -> parent (e.g. Architecture derived_from Requirement).
      // Let's check both directions to be safe.
      if (!targetToSources.has(e.targetId)) targetToSources.set(e.targetId, []);
      targetToSources.get(e.targetId)!.push(e.sourceId);

      if (!targetToSources.has(e.sourceId)) targetToSources.set(e.sourceId, []);
      targetToSources.get(e.sourceId)!.push(e.targetId);
    });

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    for (const req of requirements) {
      const connectedIds = targetToSources.get(req.id) || [];
      const connectedNodes = connectedIds.map(id => nodeMap.get(id)).filter(Boolean) as GraphNode[];
      
      const reqTasks = connectedNodes.filter(n => n.type === NodeType.TASK);
      const reqTests = connectedNodes.filter(n => n.type === NodeType.TEST);

      report.traceabilityMap[req.id] = {
        tasks: reqTasks,
        tests: reqTests
      };

      // A requirement is "covered" if it has at least one task or test associated with it.
      // (For a stricter definition, you might require both).
      if (reqTasks.length > 0 || reqTests.length > 0) {
        report.coveredRequirements++;
      } else {
        report.uncoveredNodes.push(req);
      }
    }

    report.fulfillmentPercentage = Math.round((report.coveredRequirements / report.totalRequirements) * 100);

    return report;
  }
}

import { DomainEvent } from "@/platform/events/DomainEvent";
export type NodeType = "SPECIFICATION" | "ARCHITECTURE" | "TASK" | "DECISION" | "EXECUTION_PACK" | "MEMORY" | "WORKFLOW";
export type RelationshipType = "GENERATES" | "DEPENDS_ON" | "AFFECTS" | "RESOLVES" | "IMPLEMENTS";

export interface GraphMutationNode {
  type: NodeType;
  title: string;
  externalId: string;
  summary?: string;
  metadata?: any;
}

export interface GraphMutationEdge {
  fromExternalId: string;
  toExternalId: string;
  relationshipType: RelationshipType;
  metadata?: any;
}

export interface GraphProjectionResult {
  nodesToUpsert: GraphMutationNode[];
  edgesToCreate: GraphMutationEdge[];
}

export class GraphProjection {
  /**
   * Projects a DomainEvent into a declarative set of graph mutations (nodes to create/update and edges to link).
   * This decouples the business logic of 'what happened' from the graph database implementation.
   */
  static project(event: DomainEvent): GraphProjectionResult {
    const result: GraphProjectionResult = {
      nodesToUpsert: [],
      edgesToCreate: []
    };

    const payload = event.payload as any;

    switch (event.type) {
      case "SpecificationCreated":
        if (payload.versionId) {
          result.nodesToUpsert.push({
            type: "SPECIFICATION",
            title: `Specification ${payload.versionId}`,
            externalId: payload.versionId,
            summary: "Generated System Specification",
            metadata: { workflowId: event.workflowId }
          });
        }
        break;

      case "ArchitectureGenerated":
        if (payload.versionId) {
          result.nodesToUpsert.push({
            type: "ARCHITECTURE",
            title: `Architecture ${payload.versionId}`,
            externalId: payload.versionId,
            summary: "Generated System Architecture",
            metadata: { workflowId: event.workflowId }
          });

          // Link to Specification if we know it from the workflow context (assuming we can derive the spec ID).
          // For now, if we don't have the explicit ID in the payload, we might not emit the edge here,
          // or we emit an edge to a known specification external ID.
          // Let's assume the payload might contain `specificationVersionId` or similar.
          if (payload.sourceVersionId) {
            result.edgesToCreate.push({
              fromExternalId: payload.versionId,
              toExternalId: payload.sourceVersionId,
              relationshipType: "GENERATES",
              metadata: { sourceEventId: event.id }
            });
          }
        }
        break;

      case "TasksGenerated":
        if (payload.versionId) {
          result.nodesToUpsert.push({
            type: "TASK",
            title: `Task Breakdown ${payload.versionId}`,
            externalId: payload.versionId,
            summary: "Generated Tasks",
            metadata: { workflowId: event.workflowId }
          });

          if (payload.sourceVersionId) {
            result.edgesToCreate.push({
              fromExternalId: payload.versionId,
              toExternalId: payload.sourceVersionId,
              relationshipType: "GENERATES",
              metadata: { sourceEventId: event.id }
            });
          }
        }
        break;

      case "DecisionCreated":
        if (payload.entityId) {
          result.nodesToUpsert.push({
            type: "DECISION",
            title: payload.metadata?.title || `Decision ${payload.entityId}`,
            externalId: payload.entityId,
            summary: "Engineering Decision",
            metadata: { workflowId: event.workflowId, ...payload.metadata }
          });

          // If the decision relates to an artifact, we link it
          if (payload.artifactVersionId) {
            result.edgesToCreate.push({
              fromExternalId: payload.entityId,
              toExternalId: payload.artifactVersionId,
              relationshipType: "AFFECTS",
              metadata: { sourceEventId: event.id }
            });
          }
        }
        break;

      case "ExecutionPackGenerated":
        if (payload.versionId) {
          result.nodesToUpsert.push({
            type: "EXECUTION_PACK",
            title: `Execution Pack ${payload.versionId}`,
            externalId: payload.versionId,
            summary: "Generated Execution Pack",
            metadata: { workflowId: event.workflowId }
          });
        }
        break;
        
      default:
        // No projection mapped for this event type
        break;
    }

    return result;
  }
}

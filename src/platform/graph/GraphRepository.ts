import { NodeType, RelationshipType } from "./builder/GraphProjection";

export class GraphRepository {
  static async upsertNode(
    type: NodeType,
    title: string,
    externalId: string,
    summary?: string,
    metadata?: any
  ): Promise<any> {
    console.log(`[GraphRepository] GraphNode models removed. Skipping upsert.`);
    return { id: "mock-id", type, title, externalId, summary, metadata };
  }

  static async createRelationship(
    fromId: string,
    toId: string,
    relationshipType: RelationshipType,
    metadata?: any
  ): Promise<any> {
    console.log(`[GraphRepository] GraphRelationship models removed. Skipping create.`);
    return { id: "mock-rel-id", fromId, toId, relationshipType, metadata };
  }

  static async findByType(type: NodeType): Promise<any[]> {
    return [];
  }

  static async findRelationship(fromId: string, toId: string): Promise<any[]> {
    return [];
  }

  static async deleteNode(id: string): Promise<void> {}

  static async deleteRelationship(id: string): Promise<void> {}

  static async getOutgoing(nodeId: string): Promise<any[]> {
    return [];
  }

  static async getIncoming(nodeId: string): Promise<any[]> {
    return [];
  }

  static async getNeighbors(nodeId: string, maxDepth: number = 3, direction: 'outgoing' | 'incoming' | 'both' = 'both'): Promise<{ nodes: any[], relationships: any[] }> {
    return { nodes: [], relationships: [] };
  }
}

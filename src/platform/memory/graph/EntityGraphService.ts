export class EntityGraphService {
  static async addRelationship(
    sourceType: string,
    sourceId: string,
    targetType: string,
    targetId: string,
    relationType: string
  ) {
    console.log(`[EntityGraphService] EntityRelationship models removed. Skipping addRelationship.`);
    return null;
  }

  static async getDirectRelations(entityType: string, entityId: string) {
    return { outgoing: [], incoming: [] };
  }

  static async getSubgraph(entityType: string, entityId: string, maxDepth: number = 2) {
    return { nodes: [], relationships: [] };
  }
}

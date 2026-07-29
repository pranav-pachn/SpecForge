import { db } from "../db";

export interface ResolvedNode {
  id: string;
  type: string;
  title: string;
  depth: number;
  path: string[]; // IDs of nodes traversed to reach here
}

export class RelationshipResolver {
  /**
   * Retrieves all generic relationships associated with a memory.
   */
  static async getRelationships(memoryId: string) {
    return db.memoryRelationship.findMany({
      where: {
        OR: [
          { sourceId: memoryId, sourceType: "MEMORY" },
          { targetId: memoryId, targetType: "MEMORY" }
        ]
      }
    });
  }

  /**
   * Explores the graph starting from a memory node up to maxDepth.
   * Traverses explicit MemoryRelationships and implicit domain relationships (e.g. Version -> Tasks).
   */
  static async expandRelationships(memoryId: string, maxDepth: number = 3): Promise<ResolvedNode[]> {
    const visited = new Set<string>();
    const results: ResolvedNode[] = [];
    
    // Queue stores: { id, type, title, depth, path }
    const queue: ResolvedNode[] = [{ 
      id: memoryId, 
      type: "MEMORY", 
      title: "Decision Origin", 
      depth: 0, 
      path: [memoryId] 
    }];
    
    visited.add(`MEMORY:${memoryId}`);

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      // We don't add the root memory itself to results (or we can, but usually we want impacts)
      if (current.depth > 0) {
        results.push(current);
      }

      if (current.depth >= maxDepth) continue;

      // 1. Explicit MemoryRelationships
      const memRels = await db.memoryRelationship.findMany({
        where: { sourceId: current.id, sourceType: current.type }
      });

      for (const rel of memRels) {
        const key = `${rel.targetType}:${rel.targetId}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({
            id: rel.targetId,
            type: rel.targetType,
            title: `${rel.targetType} ${rel.targetId.substring(0, 8)}`,
            depth: current.depth + 1,
            path: [...current.path, rel.targetId]
          });
        }
      }

      // 2. Implicit Domain Relationships
      if (current.type === "ARTIFACT_VERSION") {
        // Find tasks linked to this version
        const tasks = await db.task.findMany({
          where: { versionId: current.id },
          select: { id: true, title: true }
        });
        
        for (const t of tasks) {
          const key = `TASK:${t.id}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push({
              id: t.id,
              type: "TASK",
              title: t.title,
              depth: current.depth + 1,
              path: [...current.path, t.id]
            });
          }
        }
      }
      
      if (current.type === "TASK") {
        // Find dependencies
        const deps = await db.taskDependency.findMany({
          where: { dependsOnId: current.id },
          include: { task: { select: { id: true, title: true } } }
        });
        
        for (const d of deps) {
          const key = `TASK:${d.taskId}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push({
              id: d.taskId,
              type: "TASK",
              title: d.task.title,
              depth: current.depth + 1,
              path: [...current.path, d.taskId]
            });
          }
        }
      }
    }

    return results;
  }
}

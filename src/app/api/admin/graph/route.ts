import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { db } from "@/platform/storage/db";

export async function GET() {
  try {
    const nodeCount = await db.knowledgeNode.count();
    const relCount = await db.knowledgeRelationship.count();

    // Find the most connected node by grouping incoming relationships
    const topConnected = await db.knowledgeRelationship.groupBy({
      by: ["targetNodeId"],
      _count: true,
      orderBy: { _count: { targetNodeId: 'desc' } },
      take: 1
    });

    let topNode = null;
    if (topConnected.length > 0) {
      topNode = await db.knowledgeNode.findUnique({ where: { id: topConnected[0].targetNodeId } });
    }

    // Orphans: Nodes with no incoming and no outgoing relationships
    // To do this simply: count nodes where id is not in any fromId or toId
    const orphanCount = await db.$queryRaw<{count: bigint}[]>`
      SELECT COUNT(*) as count FROM "KnowledgeNode" n
      WHERE NOT EXISTS (SELECT 1 FROM "KnowledgeRelationship" r WHERE r."sourceNodeId" = n.id OR r."targetNodeId" = n.id)
    `;

    return NextResponse.json({
      nodeCount,
      relationshipCount: relCount,
      mostConnected: topNode ? { node: topNode, connections: topConnected[0]._count } : null,
      orphanCount: orphanCount[0] ? Number(orphanCount[0].count) : 0
    });
  } catch (error) {
    console.error("[GraphAdminAPI] Error", error);
    return NextResponse.json({ error: "Failed to fetch graph stats" }, { status: 500 });
  }
}

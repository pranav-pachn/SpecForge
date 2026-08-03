import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PlatformEventBus } from "@/enterprise/events/PlatformEventBus";
import { GraphService } from "@/lib/intelligence/graph/GraphService";
import { IntelligenceFacade } from "@/lib/intelligence/IntelligenceFacade";
export async function POST(
  request: Request,
  { params }: { params: { id: string; memoryId: string } }
) {
  try {
    const { action, reason } = await request.json(); // "approve" or "reject"
    
    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    IntelligenceFacade.initialize();

    const memory = await db.engineeringMemory.findUnique({
      where: {
        id: params.memoryId,
        workflowId: params.id
      }
    });

    if (!memory) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }

    if (action === "approve") {
      const updated = await db.engineeringMemory.update({
        where: { id: memory.id },
        data: {
          status: "ACTIVE",
          approvedAt: new Date(),
          approvedBy: "user_id_here" // Hardcoded for MVP
        }
      });
      
      // Trigger drift evaluation since it's now active
      const node = await GraphService.getNode(memory.id);
      if (node) {
        PlatformEventBus.emit("NODE_UPDATED", {
          workflowId: memory.workflowId,
          entityType: "GRAPH_NODE",
          timestamp: new Date(),
          node: node
        });
      }
      
      return NextResponse.json(updated);
    } else {
      const updated = await db.engineeringMemory.update({
        where: { id: memory.id },
        data: {
          status: "REJECTED",
          rejectedReason: reason
        }
      });
      return NextResponse.json(updated);
    }
  } catch (error: any) {
    console.error("[Memory Approval API] Failed to approve/reject memory", error);
    return NextResponse.json(
      { error: "Failed to approve/reject memory" },
      { status: 500 }
    );
  }
}

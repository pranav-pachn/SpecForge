import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalWorkflows,
      totalArtifacts,
      totalTasks,
      totalEvents
    ] = await Promise.all([
      prisma.workflow.count(),
      prisma.artifact.count(),
      prisma.task.count(),
      prisma.eventLog.count()
    ]);

    const eventsByType = await prisma.eventLog.groupBy({
      by: ['eventType'],
      _count: {
        id: true,
      },
    });

    const recentEvents = await prisma.eventLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      stats: {
        workflows: totalWorkflows,
        artifacts: totalArtifacts,
        tasks: totalTasks,
        events: totalEvents
      },
      eventsByType,
      recentEvents
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

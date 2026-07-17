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

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ workflows: [], projects: [] });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { workspaces: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const workspaceIds = user.workspaces.map(w => w.workspaceId);

    const workflows = await prisma.workflow.findMany({
      where: {
        name: { contains: query, mode: "insensitive" },
        project: {
          workspaceId: { in: workspaceIds }
        }
      },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true
      }
    });

    const projects = await prisma.project.findMany({
      where: {
        name: { contains: query, mode: "insensitive" },
        workspaceId: { in: workspaceIds }
      },
      take: 3,
      select: {
        id: true,
        name: true
      }
    });

    return NextResponse.json({ workflows, projects });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

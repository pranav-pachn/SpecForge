import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/server/services/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ workflows: [], projects: [] });
    }

    const workflows = await prisma.workflow.findMany({
      where: {
        creatorId: user.id,
        name: { contains: query, mode: "insensitive" },
      },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    return NextResponse.json({ workflows, projects: [] });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

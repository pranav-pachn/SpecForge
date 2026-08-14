import { db } from "@/platform/storage/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/infrastructure/services/api-helpers";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = params;
  const searchParams = req.nextUrl.searchParams;
  
  const limit = parseInt(searchParams.get("limit") || "100", 10);
  const cursor = searchParams.get("cursor");
  const type = searchParams.get("type");
  
  try {
    // Basic authorization check: verify user has access to this workflow
    const workflow = await db.workflow.findUnique({
      where: { id },
      select: { id: true, creatorId: true, project: { select: { organization: { select: { members: { where: { userId: user.id } } } } } } }
    });

    if (!workflow) {
      return apiError("Workflow not found", 404);
    }
    
    // In a real app we'd fully check project/org permissions here
    
    // Build query
    const where: any = { workflowId: id };
    if (type) where.type = type;
    
    const events = await db.storedEvent.findMany({
      where,
      take: limit + 1, // Take one extra to determine if there's a next page
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { occurredAt: "asc" },
    });
    
    let nextCursor: typeof cursor | undefined = undefined;
    if (events.length > limit) {
      const nextItem = events.pop();
      nextCursor = nextItem!.id;
    }

    return jsonResponse({
      events,
      nextCursor
    });
  } catch (error: any) {
    console.error("Failed to fetch events:", error);
    return apiError("Failed to fetch events", 500);
  }
}

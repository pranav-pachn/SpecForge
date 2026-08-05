import { NextResponse } from "next/server";
import { KnowledgeService } from "@/context/knowledge/KnowledgeService";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (query) {
      const results = await KnowledgeService.search(workflowId, query);
      return NextResponse.json({ results });
    }

    const stats = await KnowledgeService.stats(workflowId);
    return NextResponse.json({ stats });
  } catch (error) {
    console.error("[KnowledgeService API Error]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

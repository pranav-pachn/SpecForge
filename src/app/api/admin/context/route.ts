import { NextResponse } from "next/server";
import { contextLayer } from "@/platform/context/ContextLayer";
import { ContextRequest } from "@/platform/context/interfaces/ContextRequest";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, workflowId, capability } = body;

    if (!prompt || !workflowId || !capability) {
      return NextResponse.json({ error: "Missing prompt, workflowId, or capability" }, { status: 400 });
    }

    const request: ContextRequest = {
      query: prompt,
      workflowId,
      capability
    };

    // Build context
    const context = await contextLayer.build(request);

    return NextResponse.json({
      trace: context.trace,
      items: context.items.map(item => ({
        source: item.source,
        provider: item.provider,
        retrievalMethod: item.retrievalMethod,
        score: item.score,
        confidence: item.confidence,
        freshness: item.freshness,
        preview: item.content.substring(0, 150) + "..."
      }))
    });

  } catch (error) {
    console.error("[Admin API] Failed to fetch context trace", error);
    return NextResponse.json({ error: "Failed to fetch context trace" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { PlatformEventBus } from "@/platform/events/PlatformEventBus";
import { contextLayer } from "@/platform/context/ContextLayer";
import { capabilityRouter } from "@/platform/ai/CapabilityRouter";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { testLayer, payload } = body;

    if (testLayer === "EVENTS") {
      // Synthetic Event Publish
      PlatformEventBus.emit("SpecificationCreated" as any, {
        versionId: "TEST_VERSION",
        content: "Synthetic Content",
        workflowId: "TEST_WORKFLOW"
      } as any);
      return NextResponse.json({ success: true, message: "Emitted SpecificationCreated event" });
    }

    if (testLayer === "GATEWAY") {
      // Gateway Playground Route
      const capability = payload.capability || "SPECIFICATION";
      const provider = capabilityRouter.getCandidates(capability as any)[0]?.providerId;
      return NextResponse.json({ success: true, provider, capability });
    }

    if (testLayer === "CONTEXT") {
      const prompt = payload.prompt || "Why Redis?";
      const context = await contextLayer.build({
        query: prompt,
        workflowId: payload.workflowId || "TEST_WORKFLOW",
        capability: "ARCHITECTURE"
      });
      return NextResponse.json({ success: true, trace: context.trace });
    }

    return NextResponse.json({ error: "Unknown test layer" }, { status: 400 });

  } catch (error) {
    console.error("[Admin API] Failed to run test", error);
    return NextResponse.json({ error: "Failed to run test" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, apiError } from "@/infrastructure/services/api-helpers";
import { IntelligenceFacade } from "@/intelligence/IntelligenceFacade";
import { gateway } from "@/ai/gateway/gateway";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { message } = await req.json();
    if (!message) return apiError("Message is required", 400);

    const workflowId = params.id;

    // 1. Gather Intelligence Context using the Facade
    // In a real app we'd use embeddings to retrieve only relevant nodes.
    // For MVP, we'll grab a high-level summary of the graph and recent decisions.
    
    const nodes = await IntelligenceFacade.graph.getWorkflowNodes(workflowId);
    const recentMemories = await IntelligenceFacade.memory.getConsolidatedTimeline(workflowId);
    const coverage = await IntelligenceFacade.validation.calculateCoverage(workflowId);

    // Filter to top 5 recent memories to avoid context bloat
    const topMemories = recentMemories.slice(0, 5).map(m => ({
      decision: m.decisionId,
      type: m.memoryType,
      title: m.consolidatedTitle || m.title,
      description: m.description,
      reason: m.reason
    }));

    // Filter to just the node counts and types for context
    const nodeSummary = nodes.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const systemPrompt = `
You are the SpecForge Engineering Copilot, an AI assistant with deep knowledge of the project's engineering memory and dependency graph.
Your job is to answer questions about the project, explain why decisions were made, or analyze the impact of changes.

### Current Project Context
- Total Graph Nodes: ${nodes.length}
- Node Distribution: ${JSON.stringify(nodeSummary)}
- Requirement Fulfillment: ${coverage.fulfillmentPercentage}%
- Uncovered Requirements: ${coverage.uncoveredNodes.length}

### Recent Engineering Decisions
${JSON.stringify(topMemories, null, 2)}

Be concise and direct. Reference specific decisions (e.g., DEC-001) or node types when applicable.
`;

    const { text } = await gateway.execute({
      capability: "review", // using review as a general capability for reasoning
      system: systemPrompt,
      prompt: message,
    });

    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error("[Copilot API] Error:", error);
    return apiError("Failed to process copilot query", 500);
  }
}

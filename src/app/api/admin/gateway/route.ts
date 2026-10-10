import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { providerHealthMonitor } from "@/platform/ai/health/ProviderHealthMonitor";
import { keyManager } from "@/platform/ai/KeyManager";
import { capabilityRouter } from "@/platform/ai/CapabilityRouter";
import capabilityConfig from "@/platform/ai/registry/capabilities.json";

export async function GET() {
  try {
    // Capability Routing Table
    const capabilities = Object.entries(capabilityConfig).map(([id, cap]: [string, any]) => {
      let routedProvider = "unknown";
      try {
        const candidates = capabilityRouter.getCandidates(id as any);
        routedProvider = candidates[0]?.providerId || "unknown";
      } catch(e) {}
      
      return {
        id,
        name: id,
        routedProvider
      };
    });

    // Provider Metrics
    // capabilityConfig has defaultProviders mapped to providers
    const providerIds = ["google", "openai", "openrouter", "groq", "cohere", "anthropic"];
    const providerMetrics = providerIds.map(id => {
      const averageLatency = providerHealthMonitor.getAverageLatency(id);
      const failureRate = providerHealthMonitor.getFailureRate(id);
      const isHealthy = providerHealthMonitor.isHealthy(id);
      
      return {
        id,
        isHealthy,
        averageLatencyMs: averageLatency,
        failureRate,
        circuitOpen: !isHealthy
      };
    });

    return NextResponse.json({
      capabilities,
      providers: providerMetrics,
      keys: {
        // We might not be able to dynamically get key counts from the manager without exposing internals, 
        // but we can mock or use environment variables count.
        google: process.env.GOOGLE_API_KEY ? 1 : 0,
        openai: process.env.OPENAI_API_KEY ? 1 : 0,
        openrouter: process.env.OPENROUTER_API_KEY ? 1 : 0,
        groq: process.env.GROQ_API_KEY ? 1 : 0,
      }
    });

  } catch (error) {
    console.error("[Admin API] Failed to fetch gateway metrics", error);
    return NextResponse.json({ error: "Failed to fetch gateway metrics" }, { status: 500 });
  }
}

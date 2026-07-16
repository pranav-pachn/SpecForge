import { LanguageModel } from "ai";
import { cerebras } from "../providers/cerebras";
import { groq } from "../providers/groq";
import { mistral } from "../providers/mistral";
import { openRouter } from "../providers/openrouter";

export type CapabilityType = 
  | "spec"
  | "planning"
  | "tasks"
  | "execution"
  | "review"
  | "validation"
  | "drift"
  | "clarify"
  | "auto_fix"
  | "review_gate";

export interface ProviderRoute {
  provider: "cerebras" | "groq" | "mistral" | "openrouter";
  model: string;
}

export interface CapabilityRoute {
  primary: ProviderRoute;
  fallbacks: ProviderRoute[];
  cacheTtlMs: number;
}

// Router Configuration
export const ROUTER_CONFIG: Record<CapabilityType, CapabilityRoute> = {
  spec: {
    primary: { provider: "cerebras", model: "llama-3.3-70b" },
    fallbacks: [{ provider: "groq", model: "llama-3.3-70b-versatile" }, { provider: "mistral", model: "mistral-large-latest" }],
    cacheTtlMs: 0
  },
  planning: {
    primary: { provider: "cerebras", model: "llama-3.3-70b" },
    fallbacks: [{ provider: "groq", model: "llama-3.3-70b-versatile" }, { provider: "mistral", model: "mistral-large-latest" }],
    cacheTtlMs: 0
  },
  tasks: {
    primary: { provider: "groq", model: "llama-3.1-8b-instant" },
    fallbacks: [{ provider: "groq", model: "llama-3.3-70b-versatile" }, { provider: "mistral", model: "mistral-small-latest" }],
    cacheTtlMs: 0
  },
  execution: {
    primary: { provider: "cerebras", model: "llama-3.3-70b" },
    fallbacks: [{ provider: "groq", model: "llama-3.3-70b-versatile" }, { provider: "mistral", model: "mistral-large-latest" }],
    cacheTtlMs: 0
  },
  review: {
    primary: { provider: "groq", model: "llama-3.3-70b-versatile" },
    fallbacks: [{ provider: "mistral", model: "mistral-large-latest" }],
    cacheTtlMs: 1000 * 60 * 5 // 5 minutes
  },
  validation: {
    primary: { provider: "groq", model: "llama-3.1-8b-instant" },
    fallbacks: [{ provider: "groq", model: "llama-3.3-70b-versatile" }, { provider: "mistral", model: "mistral-small-latest" }],
    cacheTtlMs: 1000 * 60 * 5 // 5 minutes
  },
  drift: {
    primary: { provider: "mistral", model: "mistral-large-latest" },
    fallbacks: [{ provider: "groq", model: "llama-3.3-70b-versatile" }],
    cacheTtlMs: 1000 * 60 * 2 // 2 minutes
  },
  clarify: {
    primary: { provider: "openrouter", model: "deepseek/deepseek-r1:free" },
    fallbacks: [{ provider: "groq", model: "llama-3.3-70b-versatile" }, { provider: "mistral", model: "mistral-large-latest" }],
    cacheTtlMs: 0
  },
  auto_fix: {
    primary: { provider: "openrouter", model: "deepseek/deepseek-r1:free" },
    fallbacks: [{ provider: "groq", model: "llama-3.3-70b-versatile" }, { provider: "mistral", model: "mistral-large-latest" }],
    cacheTtlMs: 0
  },
  review_gate: {
    primary: { provider: "groq", model: "llama-3.3-70b-versatile" },
    fallbacks: [{ provider: "mistral", model: "mistral-large-latest" }],
    cacheTtlMs: 0
  }
};

export function resolveProvider(route: ProviderRoute): LanguageModel {
  switch (route.provider) {
    case "cerebras":
      return cerebras(route.model);
    case "groq":
      return groq(route.model);
    case "mistral":
      return mistral(route.model);
    case "openrouter":
      return openRouter(route.model);
    default:
      throw new Error(`Unknown provider: ${route.provider}`);
  }
}

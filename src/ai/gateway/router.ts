import { LanguageModel } from "ai";
import { cerebras } from "../providers/cerebras";
import { groq } from "../providers/groq";
import { mistral } from "../providers/mistral";
import { openRouter } from "../providers/openrouter";
import { gemini } from "../providers/gemini";

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
  | "review_gate"
  | "architect"
  | "spec_review"
  | "code_review";

export interface ProviderRoute {
  provider: "cerebras" | "groq" | "mistral" | "openrouter" | "gemini";
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
    primary: { provider: "gemini", model: "gemini-3.8-flash" },
    fallbacks: [{ provider: "cerebras", model: "llama3.1-70b" }, { provider: "openrouter", model: "anthropic/claude-3.5-sonnet" }],
    cacheTtlMs: 0
  },
  planning: {
    primary: { provider: "gemini", model: "gemini-3.8-flash" },
    fallbacks: [{ provider: "groq", model: "openai/gpt-oss-120b" }, { provider: "openrouter", model: "anthropic/claude-3.5-sonnet" }],
    cacheTtlMs: 0
  },
  tasks: {
    primary: { provider: "groq", model: "openai/gpt-oss-120b" },
    fallbacks: [{ provider: "mistral", model: "mistral-large-latest" }, { provider: "openrouter", model: "anthropic/claude-3.5-sonnet" }],
    cacheTtlMs: 0
  },
  execution: {
    primary: { provider: "cerebras", model: "llama3.1-70b" },
    fallbacks: [{ provider: "groq", model: "openai/gpt-oss-120b" }, { provider: "mistral", model: "codestral-latest" }],
    cacheTtlMs: 0
  },
  review: {
    primary: { provider: "mistral", model: "mistral-large-latest" },
    fallbacks: [{ provider: "groq", model: "openai/gpt-oss-120b" }, { provider: "openrouter", model: "anthropic/claude-3.5-sonnet" }],
    cacheTtlMs: 1000 * 60 * 5 // 5 minutes
  },
  validation: {
    primary: { provider: "mistral", model: "mistral-large-latest" },
    fallbacks: [{ provider: "groq", model: "openai/gpt-oss-120b" }, { provider: "openrouter", model: "anthropic/claude-3.5-sonnet" }],
    cacheTtlMs: 1000 * 60 * 5 // 5 minutes
  },
  drift: {
    primary: { provider: "mistral", model: "mistral-large-latest" },
    fallbacks: [{ provider: "groq", model: "openai/gpt-oss-120b" }],
    cacheTtlMs: 1000 * 60 * 2 // 2 minutes
  },
  clarify: {
    primary: { provider: "groq", model: "openai/gpt-oss-120b" },
    fallbacks: [{ provider: "mistral", model: "mistral-large-latest" }, { provider: "openrouter", model: "anthropic/claude-3.5-sonnet" }],
    cacheTtlMs: 0
  },
  auto_fix: {
    primary: { provider: "openrouter", model: "anthropic/claude-3.5-sonnet" },
    fallbacks: [{ provider: "groq", model: "openai/gpt-oss-120b" }, { provider: "mistral", model: "codestral-latest" }],
    cacheTtlMs: 0
  },
  review_gate: {
    primary: { provider: "groq", model: "openai/gpt-oss-120b" },
    fallbacks: [{ provider: "mistral", model: "mistral-large-latest" }],
    cacheTtlMs: 0
  },
  architect: {
    primary: { provider: "cerebras", model: "llama3.1-70b" },
    fallbacks: [{ provider: "groq", model: "openai/gpt-oss-120b" }, { provider: "mistral", model: "mistral-large-latest" }],
    cacheTtlMs: 0
  },
  spec_review: {
    primary: { provider: "groq", model: "openai/gpt-oss-120b" },
    fallbacks: [{ provider: "mistral", model: "mistral-large-latest" }],
    cacheTtlMs: 0
  },
  // Manual and PR code review. OpenRouter stays off this path; it is benchmark-only.
  code_review: {
    primary: { provider: "groq", model: process.env.GROQ_CODE_REVIEW_MODEL || "openai/gpt-oss-120b" },
    fallbacks: [{ provider: "gemini", model: process.env.GEMINI_CODE_REVIEW_MODEL || "gemini-3.8-flash" }],
    cacheTtlMs: 0,
  },
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
    case "gemini":
      return gemini(route.model);
    default:
      throw new Error(`Unknown provider: ${route.provider}`);
  }
}

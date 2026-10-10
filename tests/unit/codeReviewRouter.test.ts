import { describe, expect, it } from "vitest";
import { ROUTER_CONFIG } from "@/ai/gateway/router";

describe("code_review routing", () => {
  it("uses Groq first and Gemini as the only fallback", () => {
    const route = ROUTER_CONFIG.code_review;
    expect(route.primary.provider).toBe("groq");
    expect(route.fallbacks.map((item) => item.provider)).toEqual(["gemini"]);
    expect(route.cacheTtlMs).toBe(0);
  });
});

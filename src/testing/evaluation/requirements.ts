export function extractRequirementIds(markdown: string): string[] {
  const matches = markdown.match(/\bREQ-\d+\b/g) ?? [];
  return Array.from(new Set(matches));
}

export type StatementKind = "MUST" | "SHOULD" | "OPTIONAL" | "PREFERENCE" | "UNCERTAIN" | "FUTURE" | "CONFLICT";

const UNCERTAIN = /\b(probably|maybe|might|if possible|not sure|unclear)\b/i;
const PREFERENCE = /\b(don't overcomplicate|do not overcomplicate|keep it simple|prefer)\b/i;
const FUTURE = /\b(later|someday|in the future|eventually|v2)\b/i;

/** Deterministic reading of informal input. This does not call a model. */
export function classifyStatement(text: string): StatementKind {
  if (UNCERTAIN.test(text)) return "UNCERTAIN";
  if (PREFERENCE.test(text)) return "PREFERENCE";
  if (FUTURE.test(text)) return "FUTURE";
  if (/\b(must|required|shall)\b/i.test(text)) return "MUST";
  if (/\b(should)\b/i.test(text)) return "SHOULD";
  return "OPTIONAL";
}

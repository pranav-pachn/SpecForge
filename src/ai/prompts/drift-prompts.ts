export const DRIFT_DIFF_PROMPT = `
You are an expert systems analyst. Your task is to compare two versions of a software specification and identify exactly what changed at the requirement/feature level.

I will provide the OLD SPECIFICATION and the NEW SPECIFICATION.

Analyze the conceptual differences. Identify features or requirements that were:
- 'added' (in new, not in old)
- 'deleted' (in old, not in new)
- 'modified' (exists in both but changed)

Respond ONLY with a JSON object in this exact format:
{
  "diffs": [
    {
      "type": "added" | "deleted" | "modified",
      "oldText": "The old requirement text (if deleted or modified)",
      "newText": "The new requirement text (if added or modified)",
      "description": "A brief 1-sentence summary of what changed."
    }
  ]
}
`;

export const DRIFT_IMPACT_SUMMARY_PROMPT = `
You are an expert technical lead reviewing a drift analysis report.
The specification changed, and we have identified downstream tasks and execution packs that are now marked as STALE.

Based on the provided diff data and impact graph counts, write a brief, human-readable summary of the impact.
Keep it under 3 sentences. Be objective and direct.

Examples:
"Added Google OAuth login. This impacts 3 tasks and 2 execution packs in the Authentication module."
"Removed the dark mode requirement. 1 task is now stale and should likely be archived."

Respond with JUST the summary string, no quotes or JSON.
`;

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ManualReviewForm() {
  const router = useRouter();
  const [kind, setKind] = useState<"CODE" | "DIFF">("DIFF");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [context, setContext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/code-reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind,
          content,
          language: language.trim() || undefined,
          context: context.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Review could not be created");
        return;
      }
      router.push(`/code-reviews/${data.id}`);
    } catch {
      setError("Review could not be created");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex gap-2">
        {(["DIFF", "CODE"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setKind(option)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${
              kind === option
                ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                : "text-slate-400 border-slate-700"
            }`}
          >
            {option === "DIFF" ? "Unified diff" : "Pasted code"}
          </button>
        ))}
      </div>
      <label className="block text-sm text-slate-400">
        Language
        <input
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
        />
      </label>
      <label className="block text-sm text-slate-400">
        {kind === "DIFF" ? "Unified diff" : "Code"}
        <textarea
          required
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={16}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100"
          placeholder={kind === "DIFF" ? "--- a/file.ts\n+++ b/file.ts\n@@ ..." : "Paste the code to review"}
        />
      </label>
      <label className="block text-sm text-slate-400">
        Optional context
        <textarea
          value={context}
          onChange={(event) => setContext(event.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
        />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={submitting || content.trim().length === 0}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting ? "Reviewing…" : "Run review"}
      </button>
    </form>
  );
}

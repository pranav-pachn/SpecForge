"use client";

import { useEffect, useState } from "react";
import type { ReviewRun } from "@/shared/schemas/review";

const outcomeTone: Record<string, string> = {
  PASS: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  COMMENT: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  REQUEST_CHANGES: "bg-red-500/15 text-red-300 border-red-500/30",
  INCOMPLETE: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

const severities = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"] as const;

export function ReviewDetail({ id }: { id: string }) {
  const [run, setRun] = useState<ReviewRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState(0);
  const [severity, setSeverity] = useState<(typeof severities)[number]>("ALL");
  const [savingFeedback, setSavingFeedback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/code-reviews/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not load review");
        if (!cancelled) setRun(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!run && error) return <p className="text-red-400">{error}</p>;
  if (!run) return <p className="text-slate-400">Loading review…</p>;

  const visible = run.findings.filter((item) => severity === "ALL" || item.severity === severity);
  const finding = visible[selected] ?? visible[0];

  async function sendFeedback(verdict: "ACCEPTED" | "DISMISSED") {
    if (!finding) return;
    setSavingFeedback(true);
    setError(null);
    try {
      const res = await fetch(`/api/code-reviews/${id}/findings/${finding.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verdict }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save feedback");
      setRun((current) => current && ({
        ...current,
        findings: current.findings.map((item) => item.id === finding.id ? { ...item, feedback: data.verdict } : item),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save feedback");
    } finally {
      setSavingFeedback(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${outcomeTone[run.outcome ?? "INCOMPLETE"]}`}>
          {run.outcome ?? run.status}
        </span>
        <span className="text-sm text-slate-400">{run.status}</span>
        {run.provider && <span className="text-xs text-slate-500">{run.provider}{run.model ? ` · ${run.model}` : ""}</span>}
      </div>
      {error && <p className="text-red-400">{error}</p>}
      {run.summary && <p className="text-slate-200">{run.summary}</p>}
      {(run.decisionReasons ?? []).length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-400">Why this outcome</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
            {(run.decisionReasons ?? []).map((reason) => <li key={reason}>{reason}</li>)}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-400">Checks</h2>
        <ul className="space-y-1 text-sm">
          {run.checks.map((check) => (
            <li key={check.analyzer} className="text-slate-300">
              {check.analyzer}: {check.status}{check.summary ? ` — ${check.summary}` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-400">Findings</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            {severities.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => { setSeverity(level); setSelected(0); }}
                className={`rounded-full border px-2 py-1 text-xs ${
                  severity === level ? "border-blue-500/40 text-blue-200" : "border-slate-800 text-slate-400"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          {visible.length === 0 && <p className="text-sm text-slate-500">No findings were kept.</p>}
          <ul className="space-y-2">
            {visible.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelected(index)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                    index === selected ? "border-blue-500/40 bg-blue-500/10" : "border-slate-800"
                  }`}
                >
                  <span className="font-medium text-slate-100">{item.title}</span>
                  <span className="mt-1 block text-xs text-slate-400">
                    {item.severity} · {item.category} · {item.validationStatus}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        {finding && (
          <div className="rounded-xl border border-slate-800 p-4 text-sm space-y-3">
            <h3 className="text-lg font-semibold text-slate-100">{finding.title}</h3>
            <p className="text-slate-300">{finding.description}</p>
            <p className="font-mono text-xs text-slate-400">
              {finding.filePath ?? "no file"}
              {finding.startLine ? `:${finding.startLine}` : ""}
              {finding.endLine && finding.endLine !== finding.startLine ? `-${finding.endLine}` : ""}
            </p>
            <p><span className="text-slate-500">Evidence. </span>{finding.evidence}</p>
            <p><span className="text-slate-500">Impact. </span>{finding.impact}</p>
            {finding.suggestedFix && <p><span className="text-slate-500">Suggested fix. </span>{finding.suggestedFix}</p>}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={savingFeedback}
                onClick={() => sendFeedback("ACCEPTED")}
                className={`rounded-lg border px-3 py-1 text-xs ${finding.feedback === "ACCEPTED" ? "border-emerald-500/40 text-emerald-300" : "border-slate-700 text-slate-300"}`}
              >
                Accepted
              </button>
              <button
                type="button"
                disabled={savingFeedback}
                onClick={() => sendFeedback("DISMISSED")}
                className={`rounded-lg border px-3 py-1 text-xs ${finding.feedback === "DISMISSED" ? "border-amber-500/40 text-amber-300" : "border-slate-700 text-slate-300"}`}
              >
                Dismissed
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

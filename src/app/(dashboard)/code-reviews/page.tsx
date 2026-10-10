"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface ReviewListItem {
  id: string;
  status: string;
  outcome: string | null;
  summary: string | null;
  inputKind: string;
  language: string | null;
  findingCount: number;
  createdAt: string;
}

export default function CodeReviewsPage() {
  const [runs, setRuns] = useState<ReviewListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/code-reviews")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not load reviews");
        setRuns(data);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Code reviews</h1>
          <p className="text-sm text-slate-400">Evidence-backed reviews of a pasted diff or snippet.</p>
        </div>
        <Link href="/code-reviews/new" className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white">
          New review
        </Link>
      </div>
      {error && <p className="text-red-400">{error}</p>}
      {runs && runs.length === 0 && <p className="text-slate-500">No reviews yet.</p>}
      <ul className="space-y-2">
        {runs?.map((run) => (
          <li key={run.id}>
            <Link href={`/code-reviews/${run.id}`} className="block rounded-xl border border-slate-800 px-4 py-3 hover:border-slate-600">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-100">{run.outcome ?? run.status}</span>
                <span className="text-xs text-slate-500">{new Date(run.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-sm text-slate-400">{run.summary ?? run.inputKind}</p>
              <p className="mt-1 text-xs text-slate-500">{run.findingCount} findings · {run.language ?? run.inputKind}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

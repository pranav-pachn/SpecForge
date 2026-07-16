"use client";

import { useState } from "react";
import { Loader2, Wand2, CheckCircle2, ExternalLink } from "lucide-react";

export default function EngineeringFindingRow({ finding, onFixGenerated }: { finding: any, onFixGenerated?: () => void }) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCritical = finding.severity === 'critical';

  const handleFix = async () => {
    if (finding.taskId || generating) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/engineering-reviews/${finding.reviewId}/findings/${finding.id}/fix`, {
        method: "POST"
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to generate fix');
      }
      onFixGenerated?.();
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setGenerating(false);
    }
  };

  const isFixed = Boolean(finding.taskId);

  return (
    <div className={`rounded-xl border transition-all ${
      isFixed
        ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
        : isCritical
        ? 'border-red-200 dark:border-red-800 glass border-white/10'
        : 'border-yellow-200 dark:border-yellow-800 glass border-white/10'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4">

        {/* Content */}
        <div className="flex items-start gap-3 min-w-0">
          <span className={`shrink-0 mt-1.5 w-2 h-2 rounded-full ${
            isFixed ? 'bg-green-500' : isCritical ? 'bg-red-500' : 'bg-yellow-500'
          }`} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isFixed
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : isCritical
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500'
              }`}>
                {isFixed ? 'Fixed' : isCritical ? 'Critical' : 'Warning'}
              </span>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{finding.title}</h4>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{finding.description}</p>
            {error && <p className="text-xs text-red-600 mt-2 font-medium">{error}</p>}
          </div>
        </div>

        {/* Action */}
        <div className="shrink-0 sm:mt-1 flex justify-end sm:justify-start">
          {isFixed ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Task Created
            </div>
          ) : (
            <button
              onClick={handleFix}
              disabled={generating}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm hover:shadow-md disabled:from-slate-400 disabled:to-slate-400"
            >
              {generating ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating...</>
              ) : (
                <><Wand2 className="w-3.5 h-3.5" />Generate Fix</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Task link if fixed */}
      {isFixed && finding.task?.title && (
        <div className="border-t border-green-200 dark:border-green-800 px-4 py-2.5 flex items-center gap-2">
          <ExternalLink className="w-3 h-3 text-green-500" />
          <span className="text-xs text-green-700 dark:text-green-400">
            Linked to: <span className="font-semibold">{finding.task.title}</span>
          </span>
        </div>
      )}
    </div>
  );
}

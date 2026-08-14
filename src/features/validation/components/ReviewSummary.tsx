import React from "react";

const metrics = [
  { label: "Requirement Coverage", score: "92%", fill: 92, status: "good" },
  { label: "Architecture Consistency", score: "100%", fill: 100, status: "good" },
  { label: "Failure Case Coverage", score: "74%", fill: 74, status: "warning" },
  { label: "Implementation Risk", score: "Medium", fill: 60, status: "warning" },
];

export function ReviewSummary() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Review Dimensions</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {metrics.map((m, i) => (
          <div key={i} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{m.label}</span>
              <span className={`text-sm font-bold ${
                m.status === 'good' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
              }`}>{m.score}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  m.status === 'good' ? 'bg-green-500' : 'bg-amber-500'
                }`}
                style={{ width: `${m.fill}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

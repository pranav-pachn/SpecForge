"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Activity, CheckCircle, XCircle, AlertTriangle, Info, Target, GitMerge } from "lucide-react";
import { format } from "date-fns";

export default function EvaluationDashboard() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/evaluation")
      .then(res => res.json())
      .then(data => {
        setRuns(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) return <div className="text-slate-400 p-8">Loading evaluation data...</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-200">Evaluation Engine</h2>
          <p className="text-slate-400 text-sm">Automated quality gates for generated artifacts</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-4 rounded-xl">
          <p className="text-xs text-slate-500 uppercase">Total Runs</p>
          <p className="text-2xl font-bold text-slate-200 mt-1">{runs.length}</p>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <p className="text-xs text-slate-500 uppercase">Pass Rate</p>
          <p className="text-2xl font-bold text-green-400 mt-1">
            {runs.length ? Math.round((runs.filter(r => r.passed).length / runs.length) * 100) : 0}%
          </p>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <p className="text-xs text-slate-500 uppercase">Critical Risks</p>
          <p className="text-2xl font-bold text-red-400 mt-1">
            {runs.filter(r => r.riskLevel === 'CRITICAL').length}
          </p>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <p className="text-xs text-slate-500 uppercase">Avg Score</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">
            {runs.length ? Math.round(runs.reduce((acc, r) => acc + r.overall, 0) / runs.length) : 0}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-300 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" /> Recent Evaluations
        </h3>
        {runs.length === 0 ? (
          <div className="glass-panel p-8 text-center text-slate-500 rounded-xl">
            No evaluation runs recorded yet.
          </div>
        ) : (
          runs.map(run => (
            <div key={run.id} className="glass-panel p-5 rounded-xl border border-slate-800/50 hover:border-slate-700/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {run.passed ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-400" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                        {run.capability}
                      </span>
                      <span className="text-slate-500 text-xs font-mono">
                        {run.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {format(new Date(run.createdAt), "PP pp")}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Risk Level</p>
                    <p className={`text-sm font-bold ${
                      run.riskLevel === 'CRITICAL' ? 'text-red-400' :
                      run.riskLevel === 'HIGH' ? 'text-orange-400' :
                      run.riskLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {run.riskLevel}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Score</p>
                    <p className="text-xl font-bold text-slate-200">{run.overall.toFixed(1)}</p>
                  </div>
                </div>
              </div>

              {/* Metrics Breakdown */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {run.metrics.map((m: any) => (
                  <div key={m.id} className="bg-slate-900/50 p-2 rounded-lg flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 uppercase truncate pr-2" title={m.evaluatorId}>
                      {m.evaluatorId.replace('eval-', '').replace('-', ' ')}
                    </span>
                    <span className={`text-xs font-mono ${m.score < 50 ? 'text-red-400' : m.score < 80 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {m.score.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Findings */}
              {run.findings.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Key Findings</p>
                  {run.findings.map((f: any) => (
                    <div key={f.id} className="flex gap-2 items-start bg-slate-900/30 p-2 rounded text-sm">
                      {f.severity === 'CRITICAL' ? <ShieldAlert className="w-4 h-4 text-red-500 mt-0.5 shrink-0" /> :
                       f.severity === 'ERROR' ? <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" /> :
                       f.severity === 'WARN' ? <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" /> :
                       <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />}
                      <span className="text-slate-300">{f.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

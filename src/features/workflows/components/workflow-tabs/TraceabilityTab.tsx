"use client";

import React, { useEffect, useState } from "react";
import { Loader2, GitBranch, CheckCircle2, AlertTriangle, FileSearch } from "lucide-react";

interface CoverageReport {
  totalRequirements: number;
  coveredRequirements: number;
  fulfillmentPercentage: number;
  uncoveredNodes: any[];
  traceabilityMap: Record<string, { tasks: any[], tests: any[] }>;
}

export const TraceabilityTab = ({ workflowId }: { workflowId: string }) => {
  const [report, setReport] = useState<CoverageReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoverage = async () => {
      try {
        const res = await fetch(`/api/workflows/${workflowId}/coverage`);
        if (res.ok) {
          const data = await res.json();
          setReport(data);
        }
      } catch (err) {
        console.error("Failed to load coverage:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCoverage();
  }, [workflowId]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!report || report.totalRequirements === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center text-muted-foreground">
        <FileSearch className="w-12 h-12 mb-4 opacity-50" />
        <p>No requirements mapped for traceability yet.</p>
        <p className="text-sm">Requirements are mapped during the planning and task breakdown phases.</p>
      </div>
    );
  }

  const isFull = report.fulfillmentPercentage === 100;

  return (
    <div className="space-y-6">
      <div className="glass border-white/10 border rounded-xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-blue-500" />
            Requirement Traceability & Coverage
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Tracking which requirements have been assigned implementation tasks and tests.
          </p>
        </div>
        <div className="text-right">
          <div className={`text-4xl font-bold ${isFull ? 'text-green-500' : 'text-amber-500'}`}>
            {report.fulfillmentPercentage}%
          </div>
          <div className="text-sm text-slate-500 font-medium">Fulfillment</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {Object.entries(report.traceabilityMap).map(([reqId, coverage]) => {
          const isCovered = coverage.tasks.length > 0 || coverage.tests.length > 0;
          return (
            <div key={reqId} className={`p-4 rounded-xl border ${isCovered ? 'bg-white/5 border-white/10' : 'bg-red-500/5 border-red-500/20'}`}>
              <div className="flex items-center gap-3 mb-4">
                {isCovered ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
                <h4 className="font-semibold text-slate-200">Requirement {reqId}</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Implementing Tasks</h5>
                  {coverage.tasks.length > 0 ? (
                    <ul className="space-y-1">
                      {coverage.tasks.map(t => (
                        <li key={t.id} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                          {t.title}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-slate-600 italic">No tasks mapped</div>
                  )}
                </div>

                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Validation Tests</h5>
                  {coverage.tests.length > 0 ? (
                    <ul className="space-y-1">
                      {coverage.tests.map(t => (
                        <li key={t.id} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                          {t.title}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-slate-600 italic">No tests mapped</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

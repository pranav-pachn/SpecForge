import React, { useState, useEffect } from "react";
import { Check, X, AlertTriangle, FileText, Beaker, FileCode2, Search, ChevronDown, ChevronRight } from "lucide-react";

import { Loader2 } from "lucide-react";

export function ValidationChecks({ workflowId }: { workflowId: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [checks, setChecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChecks = async () => {
      try {
        const res = await fetch(`/api/workflows/${workflowId}`);
        const data = await res.json();
        
        const planArtifact = data.artifacts?.find((a: any) => a.type === "PLAN");
        const rawChecks = planArtifact?.versions?.[0]?.reviewChecks || [];
        
        const mappedChecks = rawChecks.filter((c: any) => c.type === "TEST_COVERAGE").map((c: any) => {
          // Parse description string if available, or just map fields
          let title = "Validation Check";
          let requirement = "General";
          let evidence = c.description || "";
          let testFile = "unknown.test.ts";

          const match = evidence.match(/^\[(.*?)\] \[(.*?)\] \[(.*?)\] (.*)/);
          if (match) {
            requirement = match[2];
            title = match[4].split(".")[0];
            evidence = match[4];
          } else {
            title = evidence.split(".")[0] || title;
          }

          return {
            id: c.id,
            status: c.status === "PASSED" ? "PASS" : "FAIL",
            title,
            requirement,
            specVersion: "latest",
            testFile,
            evidence
          };
        });
        
        setChecks(mappedChecks);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChecks();
  }, [workflowId]);

  const toggleExpand = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  if (checks.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm text-center">
        <p className="text-slate-500">No validation checks available. Generating execution tests will populate this area.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center justify-between">
        Traceable Evidence
        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded text-[10px]">
          {checks.length} Checks
        </span>
      </h3>
      
      <div className="space-y-4">
        {checks.map((check) => (
          <div key={check.id} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {/* Header / Summary */}
            <div 
              className={`flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                expanded === check.id ? 'bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800' : ''
              }`}
              onClick={() => toggleExpand(check.id)}
            >
              <div className="flex items-center gap-3">
                {check.status === 'PASS' ? (
                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                    <X className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">{check.id}</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{check.title}</span>
                  </div>
                </div>
              </div>
              <div>
                {expanded === check.id ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              </div>
            </div>

            {/* Expanded Evidence */}
            {expanded === check.id && (
              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><FileText className="w-3 h-3" /> Requirement</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">{check.requirement}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><Search className="w-3 h-3" /> Spec</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">{check.specVersion}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><Beaker className="w-3 h-3" /> Test File</p>
                    <p className="text-sm font-mono text-slate-700 dark:text-slate-300 mt-1">{check.testFile}</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <FileCode2 className="w-3 h-3" /> Execution Evidence
                  </p>
                  <p className={`text-sm font-mono ${check.status === 'PASS' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    &gt; {check.evidence}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

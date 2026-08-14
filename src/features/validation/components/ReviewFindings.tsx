import React, { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, Info, Loader2 } from "lucide-react";

export function ReviewFindings({ workflowId }: { workflowId: string }) {
  const [findings, setFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFindings = async () => {
      try {
        const res = await fetch(`/api/workflows/${workflowId}`);
        const data = await res.json();
        
        const planArtifact = data.artifacts?.find((a: any) => a.type === "PLAN");
        const checks = planArtifact?.versions?.[0]?.reviewChecks || [];
        
        const mappedFindings = checks.filter((c: any) => c.type === "CONSISTENCY").map((c: any) => {
          // Parse description string: "[SEVERITY] [CATEGORY] [ARTIFACT] Actual description"
          let severity = "LOW";
          let category = "General";
          let artifact = "Implementation";
          let title = "Review Finding";
          let description = c.description || "";

          const match = description.match(/^\[(.*?)\] \[(.*?)\] \[(.*?)\] (.*)/);
          if (match) {
            severity = match[1];
            category = match[2];
            artifact = match[3];
            
            // split description to title and details if possible
            const parts = match[4].split(".");
            title = parts[0];
            description = parts.slice(1).join(".").trim() || match[4];
          }

          if (severity === "BLOCKER") severity = "HIGH";
          if (severity === "WARNING") severity = "MEDIUM";
          if (severity === "INFO") severity = "LOW";

          return {
            id: c.id,
            severity,
            title,
            requirement: category,
            artifact,
            impact: description,
            suggestedAction: c.status === "FAILED" ? "Required fix before validation" : "Recommended fix"
          };
        });
        
        setFindings(mappedFindings);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFindings();
  }, [workflowId]);

  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case "HIGH": return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "MEDIUM": return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "LOW": return <Info className="w-5 h-5 text-green-500" />;
      default: return null;
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case "HIGH": return "border-red-500/20 bg-red-50 dark:bg-red-500/5";
      case "MEDIUM": return "border-amber-500/20 bg-amber-50 dark:bg-amber-500/5";
      case "LOW": return "border-green-500/20 bg-green-50 dark:bg-green-500/5";
      default: return "border-slate-200";
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  if (findings.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm text-center">
        <p className="text-slate-500">No review findings available. Make sure to generate the review first.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Review Findings</h3>
      
      <div className="space-y-4">
        {findings.map(finding => (
          <div key={finding.id} className={`p-5 rounded-xl border ${getSeverityColor(finding.severity)}`}>
            <div className="flex items-start gap-4">
              <div className="mt-0.5">
                {getSeverityIcon(finding.severity)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {finding.title}
                  </h4>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    finding.severity === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                    finding.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                    'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                  }`}>
                    {finding.severity}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Related Area</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">{finding.requirement}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Artifact</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">{finding.artifact}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Impact</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{finding.impact}</p>
                  
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-4">Suggested Action</p>
                  <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-1">{finding.suggestedAction}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

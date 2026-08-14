import React, { useEffect, useState } from "react";
import { Check, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";

export function RequirementCoverage({ workflowId }: { workflowId: string }) {
  const [reqData, setReqData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoverage = async () => {
      try {
        const res = await fetch(`/api/workflows/${workflowId}`);
        const data = await res.json();
        
        const tasks = data.tasks || [];
        
        // Find all unique requirements from tasks
        const requirementsMap = new Map<string, any>();
        
        tasks.forEach((t: any) => {
          if (t.requirements && Array.isArray(t.requirements)) {
            t.requirements.forEach((req: string) => {
              if (!requirementsMap.has(req)) {
                requirementsMap.set(req, {
                  id: req,
                  title: `Requirement: ${req}`,
                  status: 'covered', // assume covered if it has a task
                  links: []
                });
              }
              const reqObj = requirementsMap.get(req);
              reqObj.links.push({
                id: t.id,
                title: t.title,
                type: 'task',
                status: t.status === "DONE" || t.status === "COMPLETED" ? 'completed' : 'pending'
              });
            });
          }
        });

        // Convert to array
        const reqArray = Array.from(requirementsMap.values());
        setReqData(reqArray);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCoverage();
  }, [workflowId]);

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  if (reqData.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm text-center">
        <p className="text-slate-500">No requirements traceability data found. Tasks may not be mapped to requirements.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center justify-between">
        Requirement Coverage
        <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded text-[10px]">
          {reqData.length} Traced
        </span>
      </h3>
      
      <div className="space-y-6">
        {reqData.map(req => (
          <div key={req.id} className="flex flex-col">
            
            {/* Requirement Header */}
            <div className="flex items-center gap-3">
              {req.status === 'covered' ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              )}
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs" title={req.id}>{req.id}</span>
              <span className="text-sm text-slate-600 dark:text-slate-300 truncate">{req.title}</span>
            </div>

            {/* Traceability Tree */}
            <div className="mt-3 ml-2 border-l-2 border-slate-100 dark:border-slate-800 space-y-2">
              {req.links.map((link: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 pl-4">
                  <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
                  <span className={`text-xs font-medium px-2 py-0.5 rounded truncate max-w-[200px] ${
                    link.type === 'task' 
                      ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : link.status === 'missing'
                        ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400'
                  }`} title={link.title || link.id}>
                    {link.title || link.id}
                  </span>
                  {link.status === 'completed' && <Check className="w-3 h-3 text-slate-400" />}
                </div>
              ))}
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}

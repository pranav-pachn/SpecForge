"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ArrowDown } from "lucide-react";

interface LineageData {
  derivedFrom: { type: string; id: string; relation: string }[];
  leadsTo: { type: string; id: string; relation: string }[];
}

export default function LineageGraph({ workflowId, memoryId }: { workflowId: string; memoryId: string }) {
  const [lineage, setLineage] = useState<LineageData | null>(null);

  useEffect(() => {
    fetch(`/api/workflows/${workflowId}/memory/${memoryId}/lineage`)
      .then(res => res.json())
      .then(setLineage)
      .catch(console.error);
  }, [workflowId, memoryId]);

  if (!lineage) return <div className="text-sm text-slate-500 animate-pulse mt-4">Loading lineage...</div>;

  if (lineage.derivedFrom.length === 0 && lineage.leadsTo.length === 0) {
    return <div className="text-sm text-slate-500 mt-4">No lineage data available for this decision.</div>;
  }

  return (
    <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-800 space-y-4">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Decision Lineage</h4>
      
      <div className="flex flex-col space-y-2">
        {lineage.derivedFrom.map((rel, i) => (
          <div key={`derived-${i}`} className="flex flex-col items-center">
            <div className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-md border border-slate-700">
              [{rel.type}] {rel.id}
            </div>
            <div className="flex items-center text-slate-500 text-[10px] my-1">
              <ArrowDown className="w-3 h-3 mr-1" />
              {rel.relation}
            </div>
          </div>
        ))}
        
        <div className="flex flex-col items-center">
          <div className="px-4 py-2 bg-purple-500/20 text-purple-300 font-medium text-sm rounded-md border border-purple-500/30">
            This Decision
          </div>
        </div>

        {lineage.leadsTo.map((rel, i) => (
          <div key={`leads-${i}`} className="flex flex-col items-center">
            <div className="flex items-center text-slate-500 text-[10px] my-1">
              <ArrowDown className="w-3 h-3 mr-1" />
              {rel.relation}
            </div>
            <div className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-md border border-slate-700">
              [{rel.type}] {rel.id}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

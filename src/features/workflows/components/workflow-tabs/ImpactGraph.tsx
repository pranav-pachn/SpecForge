"use client";

import { useEffect, useState } from "react";
import { Activity, Network, ChevronDown, ChevronUp, CheckSquare, Brain, Box, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function ImpactGraph({ workflowId, memoryId }: { workflowId: string, memoryId: string }) {
  const [impactData, setImpactData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch(`/api/workflows/${workflowId}/memory/${memoryId}/impact`)
      .then(res => res.json())
      .then(setImpactData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [workflowId, memoryId]);

  if (loading) return <div className="text-sm text-slate-500 animate-pulse mt-4">Loading impact analysis...</div>;
  if (!impactData || !impactData.categorizedImpact) return null;

  const { categories } = impactData.categorizedImpact;

  const CategoryCard = ({ title, icon, data }: { title: string, icon: React.ReactNode, data: { score: number, label: string } }) => {
    const getColor = (label: string) => {
      switch (label) {
        case "Critical": return "text-red-400 bg-red-400/10 border-red-400/20";
        case "High": return "text-orange-400 bg-orange-400/10 border-orange-400/20";
        case "Medium": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
        case "Low": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
        default: return "text-slate-500 bg-slate-800 border-slate-700 opacity-50";
      }
    };

    return (
      <div className="flex flex-col p-3 rounded-lg bg-slate-950/50 border border-slate-800">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          {icon} {title}
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-slate-200">{data.score}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getColor(data.label)}`}>
            {data.label}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-800">
      <div 
        className="flex items-center justify-between cursor-pointer group"
        onClick={() => setExpanded(!expanded)}
      >
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Network className="w-4 h-4 text-slate-500" />
          Impact Analysis
        </h4>
        <div className="text-slate-500 group-hover:text-slate-300 transition-colors">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <CategoryCard title="Architecture" icon={<Brain className="w-3 h-3" />} data={categories.architecture} />
            <CategoryCard title="Tasks" icon={<CheckSquare className="w-3 h-3" />} data={categories.tasks} />
            <CategoryCard title="Validation" icon={<CheckCircle2 className="w-3 h-3" />} data={categories.validation} />
            <CategoryCard title="Review" icon={<ShieldCheck className="w-3 h-3" />} data={categories.review} />
          </div>

          <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {impactData.affectedNodes.map((node: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-900/50 border border-slate-800 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    node.score >= 80 ? "bg-red-500/20 text-red-400 border border-red-500/20" :
                    node.score >= 50 ? "bg-orange-500/20 text-orange-400 border border-orange-500/20" :
                    "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}>
                    {node.score}
                  </span>
                  <span className="text-xs font-medium text-slate-400 uppercase">{node.type}</span>
                  <span className="text-slate-200">{node.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

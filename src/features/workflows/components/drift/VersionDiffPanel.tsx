import { PlusCircle, MinusCircle, Edit2, Info } from "lucide-react";
import type { RequirementDiff } from "@/server/services/drift-engine";

interface VersionDiffPanelProps {
  diffs: RequirementDiff[];
}

export default function VersionDiffPanel({ diffs }: VersionDiffPanelProps) {
  if (!diffs || diffs.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 glass rounded-xl mx-8 mt-8 border-white/10">
        No significant differences found at the requirement level.
      </div>
    );
  }

  return (
    <div className="px-8 mt-8">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
        Requirement Changes
        <span className="glass border-white/10 text-slate-400 px-2 py-0.5 rounded-full text-xs font-mono">
          {diffs.length}
        </span>
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {diffs.map((diff, idx) => (
          <DiffCard key={idx} diff={diff} />
        ))}
      </div>
    </div>
  );
}

function DiffCard({ diff }: { diff: RequirementDiff }) {
  const getColors = () => {
    switch (diff.type) {
      case "added": return "border-green-500/30 bg-green-500/10";
      case "deleted": return "border-red-500/30 bg-red-500/10";
      case "modified": return "border-yellow-500/30 bg-yellow-500/10";
      default: return "border-white/10 bg-white/5";
    }
  };

  const getIcon = () => {
    switch (diff.type) {
      case "added": return <PlusCircle className="w-5 h-5 text-green-400" />;
      case "deleted": return <MinusCircle className="w-5 h-5 text-red-400" />;
      case "modified": return <Edit2 className="w-5 h-5 text-yellow-400" />;
      default: return <Info className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className={`p-4 rounded-xl border backdrop-blur-sm ${getColors()} transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="uppercase text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
              {diff.type}
            </span>
            {diff.requirementId && (
              <span className="font-mono text-xs font-bold text-slate-200">
                {diff.requirementId}
              </span>
            )}
          </div>
          
          <p className="text-sm font-medium text-slate-200 mb-3">
            {diff.description}
          </p>

          <div className="space-y-2 text-xs font-mono">
            {diff.type === "modified" ? (
              <>
                <div className="p-2 rounded bg-red-500/10 text-red-300 line-through opacity-70 border border-red-500/20">
                  {diff.oldText}
                </div>
                <div className="p-2 rounded bg-green-500/10 text-green-300 border border-green-500/20">
                  {diff.newText}
                </div>
              </>
            ) : diff.type === "deleted" ? (
              <div className="p-2 rounded bg-red-500/10 text-red-300 line-through border border-red-500/20">
                {diff.oldText}
              </div>
            ) : (
              <div className="p-2 rounded bg-green-500/10 text-green-300 border border-green-500/20">
                {diff.newText}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

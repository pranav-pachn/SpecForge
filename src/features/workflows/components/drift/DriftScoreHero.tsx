import { AlertCircle, FileText, CheckCircle2, RotateCcw } from "lucide-react";

interface DriftScoreHeroProps {
  analysis: any;
  events: any[];
}

export default function DriftScoreHero({ analysis, events }: DriftScoreHeroProps) {
  const unresolvedEvents = events.filter(e => !e.resolved);
  
  if (!analysis) {
    return (
      <div className="glass border-b border-white/10 px-6 py-8">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <RotateCcw className="w-6 h-6 text-purple-600" />
          Drift Control Center
        </h2>
        <p className="text-slate-500 mt-2">
          {unresolvedEvents.length > 0
            ? `${unresolvedEvents.length} unresolved drift event${unresolvedEvents.length > 1 ? 's' : ''} require your attention.`
            : "No structured analysis found."}
        </p>
      </div>
    );
  }

  const summary = JSON.parse(analysis.summary || "{}");
  const isResolved = analysis.status === "RESOLVED";

  return (
    <div className={`border-b border-white/10 px-8 py-8 ${isResolved ? 'bg-green-500/10' : 'glass'}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <RotateCcw className="w-6 h-6 text-purple-600" />
              Drift Control Center
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase border ${
              isResolved 
                ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:border-green-800'
                : 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:border-yellow-800'
            }`}>
              {analysis.status}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-sm mt-4 glass p-2 rounded-lg inline-flex shadow-sm">
            <div className="flex items-center gap-2 px-2 border-r border-white/10">
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-slate-200">Spec Version Transition</span>
            </div>
            <div className="px-2 font-mono text-purple-400 font-bold text-glow">
              v{analysis.oldVersion?.version} → v{analysis.newVersion?.version}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <StatCard title="Changed Req" value={summary.changedRequirements} active={!isResolved && summary.changedRequirements > 0} />
          <StatCard title="Affected Tasks" value={summary.impactedTasks} active={!isResolved && summary.impactedTasks > 0} />
          <StatCard title="Affected Packs" value={summary.impactedPacks} active={!isResolved && summary.impactedPacks > 0} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, active }: { title: string, value: number, active: boolean }) {
  return (
    <div className={`p-4 rounded-xl border flex flex-col items-center justify-center min-w-[100px] transition-all duration-300 ${
      active 
        ? 'glass-panel glow-border border-purple-500/50 scale-105' 
        : 'glass border-white/5 opacity-60'
    }`}>
      <span className={`text-3xl font-black ${active ? 'text-purple-400 text-glow' : 'text-slate-400'}`}>
        {value || 0}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">
        {title}
      </span>
    </div>
  );
}

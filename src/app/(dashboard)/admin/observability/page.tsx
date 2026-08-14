"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Search, Activity, Zap, Database, GitMerge, ListTree } from "lucide-react";
import Link from "next/link";

export default function ObservabilityPage() {
  const [query, setQuery] = useState("");
  const [traces, setTraces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/traces?query=${encodeURIComponent(query)}`);
      const json = await res.json();
      setTraces(json.traces || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
        <Activity className="w-5 h-5 text-purple-400" />
        Observability Platform
      </h2>
      <p className="text-slate-400 text-sm">
        Search traces by <code className="text-slate-300">workflowId</code> or <code className="text-slate-300">executionId</code> to view full distributed execution trees.
      </p>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Enter Workflow ID or Execution ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
          />
        </div>
        <button 
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {loading ? "Searching..." : "Search Traces"}
        </button>
      </div>

      {traces.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-semibold text-slate-300 mb-6 border-b border-slate-800 pb-4">
            Trace Results <span className="text-slate-500 text-sm ml-2">({traces.length} traces found)</span>
          </h3>

          <div className="space-y-4">
            {traces.map((trace) => (
              <div key={trace.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-slate-200">Execution Trace</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                      trace.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                      trace.status === 'FAILED' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {trace.status}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-500 space-y-1">
                    <div>Exec ID: <span className="text-slate-400">{trace.executionId}</span></div>
                    <div>Workflow: <span className="text-slate-400">{trace.workflowId}</span></div>
                    <div>Started: {format(new Date(trace.startedAt), "PPpp")}</div>
                    <div>Spans Captured: {trace.spans?.length || 0}</div>
                  </div>
                </div>
                
                <Link href={`/workflow/${trace.workflowId}/replay?executionId=${trace.executionId}`} className="flex flex-col items-center justify-center p-3 rounded-lg bg-purple-900/20 hover:bg-purple-900/40 text-purple-400 transition-colors border border-purple-900/50">
                  <ListTree className="w-6 h-6 mb-1" />
                  <span className="text-xs font-semibold">View Replay</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {traces.length === 0 && !loading && query && (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500">
          No traces found for that query.
        </div>
      )}
    </div>
  );
}

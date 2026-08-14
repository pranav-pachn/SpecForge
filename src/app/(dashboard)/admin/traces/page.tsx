"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Search, ChevronDown, ChevronRight, Activity, Zap, Database, GitMerge } from "lucide-react";

export default function TracesPage() {
  const [query, setQuery] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/traces?query=${encodeURIComponent(query)}`);
      const json = await res.json();
      setEvents(json.events || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (type: string) => {
    if (type.includes("Gateway") || type.includes("Provider") || type.includes("Model")) return <Zap className="w-4 h-4 text-amber-400" />;
    if (type.includes("Context") || type.includes("Retrieval")) return <Database className="w-4 h-4 text-blue-400" />;
    if (type.includes("Decision") || type.includes("Memory")) return <GitMerge className="w-4 h-4 text-purple-400" />;
    return <Activity className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <h2 className="text-xl font-bold text-slate-200">Execution Trace Timeline</h2>
      <p className="text-slate-400 text-sm">
        Search by <code className="text-slate-300">workflowId</code> or <code className="text-slate-300">correlationId</code> to view the chronological trace of events across all platform layers.
      </p>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Enter Workflow ID or Correlation ID..."
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
          {loading ? "Searching..." : "Search Trace"}
        </button>
      </div>

      {events.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
            <h3 className="text-lg font-semibold text-slate-300">
              Trace Results <span className="text-slate-500 text-sm ml-2">({events.length} events found)</span>
            </h3>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-slate-800">
            {events.map((event, index) => {
              const isExpanded = expandedId === event.id;
              
              return (
                <div key={event.id} className="relative">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[30px] top-1 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center z-10">
                    {getIconForType(event.type)}
                  </div>

                  <div 
                    className={`bg-slate-900/50 border ${isExpanded ? 'border-purple-500/50' : 'border-slate-800 hover:border-slate-700'} rounded-xl overflow-hidden transition-colors cursor-pointer`}
                    onClick={() => setExpandedId(isExpanded ? null : event.id)}
                  >
                    <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200">{event.type}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                              event.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                              event.status === 'FAILED' ? 'bg-red-500/20 text-red-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {event.status}
                            </span>
                          </div>
                          <div className="text-xs font-mono text-slate-500 mt-1 flex items-center gap-3">
                            <span>{format(new Date(event.occurredAt), "HH:mm:ss.SSS")}</span>
                            {event.source && <span className="text-slate-400">src: {event.source}</span>}
                          </div>
                        </div>
                      </div>
                      
                      {event.correlationId && (
                        <div className="text-xs font-mono text-slate-600 bg-black/20 px-2 py-1 rounded hidden md:block">
                          corr: {event.correlationId.substring(0, 12)}...
                        </div>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="p-4 bg-black/40 border-t border-slate-800/50 overflow-x-auto">
                        <pre className="text-xs font-mono text-slate-300">
                          {JSON.stringify(event.payload, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {events.length === 0 && !loading && query && (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500">
          No trace events found for that query.
        </div>
      )}
    </div>
  );
}

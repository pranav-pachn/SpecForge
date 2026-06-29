"use client";

import { useEffect, useState } from "react";
import { Loader2, Route, AlertCircle, CheckCircle2, FileText, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DriftTab({ workflowId, onMutate }: { workflowId: string, onMutate?: () => void }) {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "UNRESOLVED">("UNRESOLVED");

  useEffect(() => {
    fetchData();
  }, [workflowId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/drift?workflowId=${workflowId}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string, resolved: boolean) => {
    try {
      await fetch(`/api/drift/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved }),
      });
      setEvents(events.map(e => e.id === id ? { ...e, resolved } : e));
      onMutate?.();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  const filteredEvents = filter === "UNRESOLVED" ? events.filter(e => !e.resolved) : events;
  const unresolvedCount = events.filter(e => !e.resolved).length;

  if (events.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-950 border rounded-xl p-12 text-center shadow-sm">
        <Route className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">No Drift Detected</h3>
        <p className="text-slate-500 mb-6 max-w-lg mx-auto">
          Your pipeline is fully synchronized. There are no changes to upstream specifications or plans that have impacted downstream artifacts.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-950 border rounded-xl shadow-sm overflow-hidden">
      <div className="bg-slate-50 dark:bg-slate-900 border-b px-6 py-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Route className="w-6 h-6 text-purple-600" />
            Drift Control Center
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {unresolvedCount > 0 
              ? `${unresolvedCount} unresolved drift event${unresolvedCount > 1 ? 's' : ''} require your attention.`
              : "All drift events resolved."}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-md overflow-hidden bg-white dark:bg-slate-800">
            <button
              onClick={() => setFilter("UNRESOLVED")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${filter === "UNRESOLVED" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50" : "text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
            >
              Unresolved
            </button>
            <button
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1.5 text-sm font-medium border-l transition-colors ${filter === "ALL" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50" : "text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
            >
              All Events
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4 max-w-4xl mx-auto">
          {filteredEvents.map(event => (
            <div key={event.id} className="border rounded-xl p-5 bg-white dark:bg-slate-900 flex gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="shrink-0 mt-1">
                {event.resolved ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-purple-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className="uppercase text-xs font-black tracking-wider text-purple-600 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded">
                        {event.entityType}
                      </span>
                      Drift Detected
                    </h3>
                    <p className="text-sm mt-2 text-slate-700 dark:text-slate-300">
                      {event.description}
                    </p>
                  </div>
                  <div className="shrink-0 ml-4">
                    {event.resolved ? (
                      <button 
                        onClick={() => handleResolve(event.id, false)}
                        className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                      >
                        Re-open
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleResolve(event.id, true)}
                        className="bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-900/50 dark:hover:bg-purple-900 dark:text-purple-300 text-sm font-medium px-4 py-2 rounded-md transition-colors"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 flex items-center gap-3 text-xs bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border">
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-medium mb-1">Source Update</span>
                    <span className="font-mono bg-white dark:bg-slate-800 px-2 py-1 rounded border">
                      {event.sourceVersion?.artifact?.title} (v{event.sourceVersion?.version})
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-medium mb-1">Impacted Artifact</span>
                    <span className="font-mono bg-white dark:bg-slate-800 px-2 py-1 rounded border">
                      {event.version?.artifact?.title} (v{event.version?.version})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredEvents.length === 0 && filter === "UNRESOLVED" && (
            <div className="text-center p-8 text-slate-500">
              No unresolved drift events.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

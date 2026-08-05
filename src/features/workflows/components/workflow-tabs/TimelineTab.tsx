"use client";

import { useEffect, useState } from "react";
import { Loader2, Activity, Clock, Server, User, Hash, Box } from "lucide-react";
import { format } from "date-fns";

interface StoredEvent {
  id: string;
  type: string;
  source: string;
  occurredAt: string;
  workflowId?: string;
  sequence: number;
  userId?: string;
  correlationId?: string;
  causationId?: string;
  status: string;
  payload: any;
}

export function TimelineTab({ workflowId }: { workflowId: string }) {
  const [events, setEvents] = useState<StoredEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`/api/workflows/${workflowId}/events`);
        if (!res.ok) throw new Error("Failed to fetch events");
        const data = await res.json();
        setEvents(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [workflowId]);

  const toggleExpand = (id: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getEventSummary = (event: StoredEvent): string => {
    switch (event.type) {
      case "SpecificationCreated":
        return `Generated specification with length ${event.payload?.content?.length || 0} chars`;
      case "ArchitectureGenerated":
        return `Generated architecture outline`;
      case "TasksGenerated":
        return `Generated ${event.payload?.content?.length || 0} tasks`;
      case "ReviewCompleted":
        return `Review completed with score ${event.payload?.overallScore || 0}`;
      case "ValidationCompleted":
        return `Validation completed with ${event.payload?.issuesCount || 0} issues found`;
      case "WorkflowCreated":
        return `Workflow initialized`;
      case "WorkflowCompleted":
        return `Workflow completed with status ${event.payload?.status}`;
      default:
        return `Event ${event.type} processed`;
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-12 rounded-xl flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-12 rounded-xl border-red-500/20 flex flex-col items-center justify-center">
        <Activity className="w-8 h-8 text-red-400 mb-4" />
        <p className="text-red-400 font-medium">{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="glass-panel p-12 rounded-xl flex flex-col items-center justify-center text-slate-400">
        <Clock className="w-8 h-8 mb-4 opacity-50" />
        <p>No events recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-xl space-y-6">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-semibold text-slate-200">Workflow Timeline</h2>
          <p className="text-sm text-slate-400">Chronological history of all events.</p>
        </div>
        <div className="bg-slate-800/50 text-slate-300 text-xs px-3 py-1 rounded-full border border-white/5">
          {events.length} Events
        </div>
      </div>

      <div className="relative border-l border-white/10 ml-4 space-y-8 pb-4">
        {events.map((event, i) => {
          const isExpanded = expandedEvents.has(event.id);
          const isLast = i === events.length - 1;

          return (
            <div key={event.id} className="relative pl-8">
              {/* Timeline dot */}
              <div className="absolute left-[-5px] top-1.5 w-[9px] h-[9px] rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] ring-4 ring-[#0f172a]" />
              
              <div 
                className="group cursor-pointer"
                onClick={() => toggleExpand(event.id)}
              >
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-sm font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                    {event.type}
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    {format(new Date(event.occurredAt), "HH:mm:ss")}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    event.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' : 
                    event.status === 'FAILED' ? 'bg-red-500/10 text-red-400' : 
                    'bg-slate-500/10 text-slate-400'
                  }`}>
                    {event.status}
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  {getEventSummary(event)}
                </p>
              </div>

              {isExpanded && (
                <div className="mt-4 bg-slate-900/50 rounded-lg border border-white/5 overflow-hidden text-sm">
                  <div className="grid grid-cols-2 gap-4 p-4 border-b border-white/5 bg-black/20">
                    <div className="space-y-1">
                      <div className="text-xs text-slate-500 flex items-center gap-1.5"><Server className="w-3 h-3" /> Source</div>
                      <div className="font-mono text-slate-300 text-xs">{event.source}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-slate-500 flex items-center gap-1.5"><Hash className="w-3 h-3" /> Sequence</div>
                      <div className="font-mono text-slate-300 text-xs">{event.sequence}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-slate-500 flex items-center gap-1.5"><Hash className="w-3 h-3" /> Correlation ID</div>
                      <div className="font-mono text-slate-300 text-xs truncate" title={event.correlationId}>{event.correlationId || "N/A"}</div>
                    </div>
                    {event.userId && (
                      <div className="space-y-1">
                        <div className="text-xs text-slate-500 flex items-center gap-1.5"><User className="w-3 h-3" /> User ID</div>
                        <div className="font-mono text-slate-300 text-xs truncate" title={event.userId}>{event.userId}</div>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-2"><Box className="w-3 h-3" /> Payload</div>
                    <pre className="text-xs text-slate-300 font-mono bg-black/40 p-3 rounded overflow-x-auto">
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

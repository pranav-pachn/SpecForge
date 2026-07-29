"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock, Activity, Box, CheckSquare, ChevronDown, Check, X, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DriftEvent {
  id: string;
  versionId: string;
  sourceVersionId: string;
  entityType: string;
  entityId: string;
  description: string;
  status: "OPEN" | "ACKNOWLEDGED" | "REGENERATED" | "RESOLVED" | "IGNORED";
  createdAt: string;
  sourceVersion: {
    artifact: {
      type: string;
      title: string;
    }
  }
}

export default function DriftAlerts({ workflowId }: { workflowId: string }) {
  const [driftEvents, setDriftEvents] = useState<DriftEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    fetchDriftEvents();
  }, [workflowId]);

  const fetchDriftEvents = async () => {
    try {
      const res = await fetch(`/api/workflows/${workflowId}/drift`);
      if (res.ok) {
        const data = await res.json();
        setDriftEvents(data);
      }
    } catch (e) {
      console.error("Failed to fetch drift events", e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      // Optimistic update
      setDriftEvents(prev => prev.map(e => e.id === id ? { ...e, status: newStatus as any } : e)
        .filter(e => e.status !== "RESOLVED" && e.status !== "IGNORED"));
      
      setOpenDropdown(null);

      await fetch(`/api/workflows/${workflowId}/drift/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      
    } catch (e) {
      console.error("Failed to update status", e);
      // Revert on failure (simple implementation)
      fetchDriftEvents();
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "TASK": return <CheckSquare className="w-4 h-4" />;
      case "PACK": return <Box className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "text-red-400 bg-red-400/10 border-red-400/20";
      case "ACKNOWLEDGED": return "text-orange-400 bg-orange-400/10 border-orange-400/20";
      case "REGENERATED": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      default: return "text-slate-400 bg-slate-400/10 border-slate-400/20";
    }
  };

  const activeEvents = driftEvents.filter(e => e.status !== "RESOLVED" && e.status !== "IGNORED");

  if (loading || activeEvents.length === 0) return null;

  return (
    <div className="mb-6 space-y-3 animate-in fade-in slide-in-from-top-2">
      <h3 className="text-sm font-semibold flex items-center gap-2 text-orange-400">
        <AlertTriangle className="w-4 h-4" />
        Intelligent Drift Detected
      </h3>
      
      {activeEvents.map((event) => (
        <div key={event.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-orange-950/20 border border-orange-500/20 rounded-xl gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getStatusColor(event.status)}`}>
                {event.status}
              </span>
              <span className="text-sm font-medium text-slate-200 flex items-center gap-1.5">
                {getEntityIcon(event.entityType)}
                {event.entityType} Stale
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1 ml-2">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-slate-300">
              {event.description}
            </p>
            <div className="text-xs text-slate-500 mt-1">
              Source change: <span className="font-medium text-slate-400">{event.sourceVersion?.artifact?.title || "Unknown"}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0 relative">
            
            {event.status === "OPEN" && (
              <button 
                onClick={() => updateStatus(event.id, "ACKNOWLEDGED")}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 transition-colors border border-orange-500/30 flex items-center gap-1.5"
              >
                Acknowledge
              </button>
            )}

            {event.status === "ACKNOWLEDGED" && (
              <button 
                onClick={() => updateStatus(event.id, "REGENERATED")}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors border border-emerald-500/30 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" />
                Regenerate
              </button>
            )}

            {event.status === "REGENERATED" && (
              <button 
                onClick={() => updateStatus(event.id, "RESOLVED")}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors border border-emerald-500/30 flex items-center gap-1.5"
              >
                <Check className="w-3 h-3" />
                Resolve
              </button>
            )}

            <div className="relative">
              <button 
                onClick={() => setOpenDropdown(openDropdown === event.id ? null : event.id)}
                className="px-2 py-1.5 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 flex items-center gap-1"
              >
                More <ChevronDown className="w-3 h-3" />
              </button>
              
              {openDropdown === event.id && (
                <div className="absolute right-0 mt-1 w-36 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-10 py-1">
                  <button 
                    onClick={() => updateStatus(event.id, "IGNORED")}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                  >
                    <X className="w-3 h-3" />
                    Ignore Drift
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Brain, Clock, ShieldAlert, FileText, CheckCircle2, AlertTriangle, Check, X, History } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ImpactGraph from "./ImpactGraph";
import LineageGraph from "./LineageGraph";

export default function MemoryTab({ workflowId }: { workflowId: string }) {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [expandedMemoryId, setExpandedMemoryId] = useState<string | null>(null);
  const [revisions, setRevisions] = useState<Record<string, any[]>>({});

  useEffect(() => {
    fetchMemories();
  }, [workflowId, filter]);

  const fetchMemories = async () => {
    try {
      setLoading(true);
      const url = filter === "ALL" 
        ? `/api/workflows/${workflowId}/memory` 
        : `/api/workflows/${workflowId}/memory?type=${filter}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setMemories(data || []);
    } catch (e) {
      console.error("Failed to fetch engineering memory", e);
    } finally {
      setLoading(false);
    }
  };

  const loadRevisions = async (memoryId: string) => {
    if (revisions[memoryId]) return;
    try {
      const res = await fetch(`/api/workflows/${workflowId}/memory/${memoryId}/revisions`);
      const data = await res.json();
      setRevisions(prev => ({ ...prev, [memoryId]: data }));
    } catch (e) {
      console.error("Failed to fetch revisions", e);
    }
  };

  const handleApproveReject = async (memoryId: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/workflows/${workflowId}/memory/${memoryId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: "Manual UI Action" })
      });
      if (res.ok) {
        fetchMemories(); // Refresh the list
      }
    } catch (e) {
      console.error("Failed to approve/reject memory", e);
    }
  };

  const toggleExpand = (memoryId: string) => {
    if (expandedMemoryId === memoryId) {
      setExpandedMemoryId(null);
    } else {
      setExpandedMemoryId(memoryId);
      const memory = memories.find(m => m.id === memoryId);
      if (memory && memory.revisionCount > 1) {
        loadRevisions(memoryId);
      }
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return "text-red-400 bg-red-400/10 border-red-400/20";
      case "HIGH": return "text-orange-400 bg-orange-400/10 border-orange-400/20";
      case "MEDIUM": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "LOW": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      default: return "text-slate-400 bg-slate-400/10 border-slate-400/20";
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "REQUIREMENT_CHANGE": return <FileText className="w-5 h-5 text-indigo-400" />;
      case "ARCHITECTURE_CHANGE": return <Brain className="w-5 h-5 text-purple-400" />;
      case "TASK_CHANGE": return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case "REVIEW_RESOLUTION": return <ShieldAlert className="w-5 h-5 text-amber-400" />;
      default: return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  if (loading && memories.length === 0) {
    return <div className="p-8 text-center text-slate-400">Loading engineering memory...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Engineering Memory
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Permanent decision intelligence trace recording the evolution of this project.
          </p>
        </div>
        <div className="flex gap-2">
          {["ALL", "REQUIREMENT_CHANGE", "ARCHITECTURE_CHANGE", "TASK_CHANGE"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                filter === f 
                  ? "bg-purple-500/20 border-purple-500/30 text-purple-300" 
                  : "glass text-slate-400 hover:text-slate-300"
              }`}
            >
              {f.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
        {memories.map((memory) => {
          const isExpanded = expandedMemoryId === memory.id;
          const confidenceScore = memory.confidence ?? 1.0;
          const confidenceSources = memory.confidenceSources ? JSON.parse(memory.confidenceSources) : [];

          return (
            <div key={memory.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-950 bg-slate-900 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                {getIconForType(memory.memoryType)}
              </div>
              
              <div 
                className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border transition-all cursor-pointer ${
                  isExpanded ? "bg-slate-800/80 border-purple-500/50 shadow-lg shadow-purple-500/10" : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                } ${memory.status === "PENDING_REVIEW" ? "border-orange-500/50 bg-orange-950/20" : ""}`}
                onClick={() => toggleExpand(memory.id)}
              >
                {memory.status === "PENDING_REVIEW" && (
                  <div className="flex items-center justify-between mb-3 bg-orange-500/10 px-3 py-1.5 rounded-md border border-orange-500/20">
                    <span className="flex items-center gap-2 text-xs font-medium text-orange-400">
                      <AlertTriangle className="w-4 h-4" />
                      Awaiting Approval
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleApproveReject(memory.id, "approve"); }}
                        className="p-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleApproveReject(memory.id, "reject"); }}
                        className="p-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">{memory.decisionId}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getSeverityColor(memory.severity)}`}>
                      {memory.severity}
                    </span>
                  </div>
                  <time className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(memory.createdAt), { addSuffix: true })}
                  </time>
                </div>
                
                <h3 className="text-base font-semibold text-slate-200">{memory.consolidatedTitle || memory.title}</h3>
                
                {memory.revisionCount > 1 && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-slate-800 rounded text-[10px] text-slate-400">
                    <History className="w-3 h-3" />
                    {memory.revisionCount} Revisions
                  </div>
                )}
                
                <p className={`mt-2 text-sm text-slate-400 ${isExpanded ? "" : "line-clamp-2"}`}>
                  {memory.description}
                </p>
                
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reason</h4>
                      <p className="text-sm text-slate-300 bg-slate-950/50 p-3 rounded border border-slate-800">
                        {memory.reason}
                      </p>
                    </div>
                    
                    {confidenceSources.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex justify-between">
                          <span>Confidence Score</span>
                          <span className={confidenceScore > 0.8 ? "text-emerald-400" : confidenceScore > 0.5 ? "text-yellow-400" : "text-orange-400"}>
                            {Math.round(confidenceScore * 100)}%
                          </span>
                        </h4>
                        <div className="space-y-1">
                          {confidenceSources.map((source: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-xs bg-slate-950/30 px-2 py-1 rounded">
                              <span className="text-slate-400">{source.signal}</span>
                              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-indigo-500" 
                                  style={{ width: `${Math.min(100, source.weight * 100)}%` }} 
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {memory.revisionCount > 1 && revisions[memory.id] && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Revision History</h4>
                        <div className="space-y-2 border-l-2 border-slate-800 ml-2 pl-4">
                          {revisions[memory.id].map((rev) => (
                            <div key={rev.id} className="relative">
                              <div className="absolute w-2 h-2 rounded-full bg-slate-600 -left-[21px] top-1.5"></div>
                              <div className="text-xs text-slate-400 mb-1 flex justify-between">
                                <span>Revision {rev.revision}</span>
                                <span>{formatDistanceToNow(new Date(rev.createdAt), { addSuffix: true })}</span>
                              </div>
                              <div className="text-sm text-slate-300 font-medium">{rev.title}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <LineageGraph workflowId={workflowId} memoryId={memory.id} />
                    
                    {memory.status === "ACTIVE" && (
                      <ImpactGraph workflowId={workflowId} memoryId={memory.id} />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

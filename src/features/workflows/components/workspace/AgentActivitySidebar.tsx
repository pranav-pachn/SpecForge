"use client";

import React from "react";
import { Check, Activity, AlertTriangle, Zap, Circle } from "lucide-react";
import { StoredEvent } from "@/shared/utils/eventNormalizer";

interface AgentActivitySidebarProps {
  agents: StoredEvent[];
}

export function AgentActivitySidebar({ agents }: AgentActivitySidebarProps) {
  // Group events by agent
  const agentGroups = agents.reduce((acc, event) => {
    const source = event.source || 'System';
    if (!acc[source]) acc[source] = [];
    acc[source].push(event);
    return acc;
  }, {} as Record<string, StoredEvent[]>);

  const AgentIcon = ({ type }: { type: string }) => {
    if (type.includes('START') || type.includes('RUNNING')) return <Zap className="w-4 h-4 text-blue-500 fill-blue-500" />;
    if (type.includes('ERROR') || type.includes('FAILED')) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (type.includes('COMPLETE') || type.includes('RESOLVED')) return <Check className="w-4 h-4 text-green-500" />;
    if (type.includes('WAITING') || type.includes('PENDING')) return <Circle className="w-4 h-4 text-slate-400" />;
    return <Activity className="w-4 h-4 text-slate-400" />;
  };



  return (
    <div className="w-full flex items-center gap-4 py-3 px-2 overflow-x-auto scrollbar-hide">
      <div className="flex items-center gap-2 pr-4 border-r border-slate-200 dark:border-white/10 shrink-0">
        <Activity className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Agent Feed
        </span>
      </div>
      
      {Object.keys(agentGroups).length === 0 ? (
        <span className="text-xs text-slate-500 italic">No recent activity</span>
      ) : (
        <div className="flex gap-4">
          {Object.entries(agentGroups).map(([source, sourceEvents]) => {
            const sorted = [...sourceEvents].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
            const latestEvent = sorted[0];
            let displayName = source.replace(/Agent/i, '').replace(/([A-Z])/g, ' $1').trim();
            if (displayName.toLowerCase() === 'system') displayName = 'System';
            if (displayName.toLowerCase() === 'planner') displayName = 'Planner';
            
            let isRunning = latestEvent.status !== 'COMPLETED' && !latestEvent.type?.includes('COMPLETE');
            
            return (
              <div key={source} className="flex items-center gap-2 shrink-0 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-3 py-1.5">
                <AgentIcon type={isRunning ? 'RUNNING' : 'COMPLETE'} />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{displayName}</span>
                    {isRunning && <span className="text-[8px] uppercase tracking-widest text-blue-500 font-bold bg-blue-500/10 px-1 rounded-sm">Running</span>}
                  </div>
                  <span className="text-[10px] text-slate-500 truncate max-w-[150px]">{latestEvent.payload?.message || "Running task"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

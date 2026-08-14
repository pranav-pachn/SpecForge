"use client";

import React from "react";
import { Loader2, CheckCircle2, AlertTriangle, Zap, Clock } from "lucide-react";
import { AgentStatus } from "../../types/agent-events";

interface DynamicLoaderProps {
  agentName: string;
  status: AgentStatus;
  currentAction?: string;
  latencyMs?: number;
}

export function DynamicLoader({ agentName, status, currentAction, latencyMs }: DynamicLoaderProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 transition-all">
      <div className="mt-0.5">
        {status === 'RUNNING' && <Zap className="w-4 h-4 text-blue-500 animate-pulse" />}
        {status === 'COMPLETED' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
        {status === 'WAITING' && <Clock className="w-4 h-4 text-slate-400" />}
        {status === 'FAILED' && <AlertTriangle className="w-4 h-4 text-red-500" />}
        {status === 'STALE' && <AlertTriangle className="w-4 h-4 text-orange-500" />}
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{agentName}</span>
          {latencyMs && <span className="text-[10px] text-slate-400 font-mono">{latencyMs}ms</span>}
        </div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
          {status === 'RUNNING' && (currentAction || "Processing...")}
          {status === 'COMPLETED' && "Task completed successfully."}
          {status === 'WAITING' && "Waiting in queue..."}
          {status === 'FAILED' && "Encountered an error."}
          {status === 'STALE' && "Data has drifted. Requires update."}
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { Layers, Activity, AlertTriangle, ShieldCheck } from "lucide-react";

interface DashboardStatsProps {
  totalWorkflows: number;
  activeWorkflows: number;
  driftCount: number;
  avgValidation: number | null;
}

export function DashboardStats({ totalWorkflows, activeWorkflows, driftCount, avgValidation }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-up">
      <div className="glass rounded-2xl p-5 flex flex-col hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Workflows</p>
          <Layers className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
        </div>
        <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalWorkflows}</p>
      </div>
      
      <div className="glass rounded-2xl p-5 flex flex-col hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Active Workflows</p>
          <Activity className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
        </div>
        <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{activeWorkflows}</p>
      </div>

      <div className="glass rounded-2xl p-5 flex flex-col hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Drift Detected</p>
          <AlertTriangle className={`w-4 h-4 transition-colors ${driftCount > 0 ? 'text-orange-500' : 'text-slate-400 group-hover:text-orange-500'}`} />
        </div>
        <p className={`text-3xl font-extrabold ${driftCount > 0 ? 'text-orange-500' : 'text-slate-900 dark:text-white'}`}>{driftCount}</p>
      </div>

      <div className="glass rounded-2xl p-5 flex flex-col hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Avg Validation</p>
          <ShieldCheck className="w-4 h-4 text-slate-400 group-hover:text-green-500 transition-colors" />
        </div>
        <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
          {avgValidation !== null ? `${Math.round(avgValidation)}%` : '—'}
        </p>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { AgentEvent } from "@/shared/types/agent-events";
import { Zap, Check, Clock, AlertTriangle, X, ChevronRight, Activity, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AgentActivityPanelProps {
  events: AgentEvent[];
  isOpen: boolean;
  onToggle: () => void;
  onViewTimeline?: () => void;
}

export function AgentActivityPanel({ events, isOpen, onToggle, onViewTimeline }: AgentActivityPanelProps) {
  const runningCount = events.filter(e => e.status === 'RUNNING').length;
  
  const getStatusIcon = (status: AgentEvent['status']) => {
    switch (status) {
      case 'RUNNING': return <Zap className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'COMPLETED': return <Check className="w-4 h-4 text-green-500" />;
      case 'WAITING': return <div className="w-2 h-2 rounded-full border-2 border-slate-400/50 m-1" />;
      case 'STALE': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'FAILED': return <X className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  // The toggle button that floats when collapsed
  if (!isOpen) {
    return (
      <button 
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-right-4 glass-panel border-blue-500/20 bg-black/40 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3 shadow-[0_0_20px_rgba(59,130,246,0.15)] group hover:bg-black/60 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center relative">
          <Activity className="w-4 h-4 text-blue-400 group-hover:animate-pulse" />
          {runningCount > 0 && <div className="absolute inset-0 border border-blue-500/50 rounded-full animate-[spin_4s_linear_infinite]" />}
        </div>
        <div className="hidden sm:block pr-2 text-left">
          <div className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Agent Activity</div>
          <div className="text-xs font-medium text-slate-300">
            {runningCount > 0 ? `${runningCount} Running` : 'Idle'}
          </div>
        </div>
      </button>
    );
  }

  // The Expanded Drawer
  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden" 
        onClick={onToggle}
      />
      
      <motion.div 
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-full w-full sm:w-80 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-l border-slate-200 dark:border-white/10 shadow-2xl flex flex-col"
      >
        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center relative">
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-200">Live Agents</h2>
          </div>
          <button 
            onClick={onToggle}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors text-slate-500"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="space-y-3">
            {events.map((evt) => (
              <div 
                key={evt.agentName}
                className={`rounded-xl p-3 flex items-start gap-3 transition-colors ${
                  evt.status === 'RUNNING' 
                    ? 'bg-blue-500/10 border border-blue-500/20 glow-border' 
                    : 'bg-transparent border border-white/5 opacity-80'
                }`}
              >
                <div className="mt-0.5">{getStatusIcon(evt.status)}</div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    {evt.agentName}
                  </div>
                  {evt.status === 'RUNNING' && evt.currentAction ? (
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                      {evt.currentAction}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {evt.status === 'COMPLETED' ? `Completed ${evt.latencyMs ? `· ${evt.latencyMs}ms` : ''}` : 
                       evt.status === 'WAITING' ? "Waiting" : evt.status}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <button 
            onClick={() => {
              onToggle();
              onViewTimeline?.();
            }}
            className="w-full py-2.5 px-4 bg-slate-200 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
          >
            View full execution <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </>
  );
}

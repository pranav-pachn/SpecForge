"use client";

import { OrchestrationState } from "@/shared/utils/eventNormalizer";
import { Check, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function OrchestrationTimeline({ orchestration }: { orchestration: OrchestrationState }) {
  if (!orchestration) return null;

  const { stages, currentStageIndex } = orchestration;

  return (
    <div className="glass border border-white/10 rounded-2xl p-6 mb-8 shadow-xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-[10px] uppercase font-bold text-slate-500 tracking-[0.2em] mb-1">AI Orchestration</h3>
          <p className="text-sm font-medium text-slate-300">Where is SpecForge in the engineering process?</p>
        </div>
      </div>

      <div className="relative flex items-center justify-between">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-blue-500 -translate-y-1/2 z-0 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
          style={{ width: `${(currentStageIndex / Math.max(stages.length - 1, 1)) * 100}%` }} 
        />

        {/* Nodes */}
        {stages.map((st, i) => {
          const isActive = st.status === 'RUNNING';
          const isCompleted = st.status === 'COMPLETED';
          const isWaiting = st.status === 'WAITING';

          return (
            <div key={st.stage} className="relative z-10 flex flex-col items-center">
              <motion.div
                layout
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 bg-[#0a0a0f] ${
                  isActive 
                    ? 'border-blue-500 text-blue-400 glow-border' 
                    : isCompleted 
                    ? 'border-green-500 text-green-400 bg-green-500/10' 
                    : 'border-slate-800 text-slate-600'
                }`}
              >
                {isActive ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                )}
              </motion.div>
              
              <div className="absolute top-12 whitespace-nowrap flex flex-col items-center">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${
                  isActive ? 'text-blue-400' : isCompleted ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {st.stage}
                </span>
                {isActive && (
                  <span className="text-[10px] text-blue-500 mt-1 flex items-center gap-1 animate-pulse">
                    Currently here <ArrowRight className="w-3 h-3 rotate-90" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

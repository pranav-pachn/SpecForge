import React from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";

interface DriftSummaryProps {
  onOpenDrift: () => void;
}

export function DriftSummary({ onOpenDrift }: DriftSummaryProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm h-full flex flex-col">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Drift Status</h3>
      
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-3">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-lg font-bold text-slate-900 dark:text-white">1 requirement changed</p>
        <p className="text-sm font-medium text-red-600 dark:text-red-400 mt-1">4 artifacts affected</p>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
        <button 
          onClick={onOpenDrift}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black text-sm font-bold rounded-xl transition-all hover:opacity-90 shadow-sm"
        >
          Open Drift Center
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

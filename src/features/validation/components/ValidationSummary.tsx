import React from "react";
import { CheckCircle2, AlertTriangle, PlayCircle } from "lucide-react";

export function ValidationSummary() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm h-full flex flex-col">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Validation Result</h3>
      
      <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
        <div className="w-20 h-20 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">CONDITIONAL PASS</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
          Core functionality is verified, but there are unhandled edge cases in the latest test run.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">18 <span className="text-slate-400 text-sm">/ 18</span></p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">Requirements</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">31 <span className="text-slate-400 text-sm">/ 33</span></p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">Tests Passed</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-500">2</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">Findings</p>
        </div>
      </div>
    </div>
  );
}

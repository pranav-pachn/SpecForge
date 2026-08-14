import React, { useState } from "react";
import { Wrench, CheckCircle, ArrowRight, Activity } from "lucide-react";

interface RepairPreviewProps {
  onApply: () => void;
}

export function RepairPreview({ onApply }: RepairPreviewProps) {
  const [reviewing, setReviewing] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6">
      
      {/* Finding Context */}
      <div className="flex-1 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-500" />
          Repair Engine Proposal
        </h3>
        
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Root Cause</span>
            <span className="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 text-[10px] font-bold uppercase px-2 py-0.5 rounded">High Priority</span>
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">Missing authorization requirement</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded">REQ-04</span>
            <span className="text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded">TASK-07</span>
            <span className="text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded">Execution Pack #7</span>
          </div>
        </div>
      </div>

      {/* Suggested Repair */}
      <div className="flex-[1.5] flex flex-col">
        <div className="bg-indigo-50 dark:bg-indigo-500/5 rounded-xl p-5 border border-indigo-100 dark:border-indigo-500/20 flex-1 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-2">
              Suggested Repair
            </h4>
            <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
              Add authorization middleware to admin mutation endpoints. Update `AuthService` architecture and regenerate Execution Pack #7.
            </p>
          </div>
          
          <div className="mt-6 flex items-center justify-end gap-3">
            {!reviewing ? (
              <button 
                onClick={() => setReviewing(true)}
                className="px-4 py-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg transition-colors"
              >
                Review Changes
              </button>
            ) : (
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 px-4 py-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
                Changes Approved
              </span>
            )}

            <button 
              onClick={onApply}
              disabled={!reviewing}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-lg transition-all shadow-sm ${
                reviewing 
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Wrench className="w-4 h-4" />
              Apply Repair
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

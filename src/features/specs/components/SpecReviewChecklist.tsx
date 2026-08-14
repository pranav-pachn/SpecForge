"use client";

import React from "react";
import { Check, AlertTriangle, AlertCircle, Play } from "lucide-react";

interface SpecReviewChecklistProps {
  content: string;
  onApprove: () => void;
  isLoading: boolean;
  onAction?: (actionId: string) => void;
}

export function SpecReviewChecklist({ content, onApprove, isLoading, onAction }: SpecReviewChecklistProps) {
  // Simple heuristic checks based on content parsing for Sprint 3
  const checks = [
    {
      id: "goals",
      label: "Goals defined",
      passed: content.toLowerCase().includes("## goals") || content.toLowerCase().includes("goal:"),
      required: true,
      actionText: "Add Goals section"
    },
    {
      id: "scope",
      label: "Scope & Non-goals",
      passed: content.toLowerCase().includes("non-goals") || content.toLowerCase().includes("out of scope"),
      required: true,
      actionText: "Add Scope section"
    },
    {
      id: "criteria",
      label: "Acceptance Criteria",
      passed: content.toLowerCase().includes("acceptance criteria") || content.toLowerCase().includes("requirements"),
      required: true,
      actionText: "Add Criteria section"
    },
    {
      id: "api",
      label: "API / Interfaces",
      passed: content.toLowerCase().includes("api") || content.toLowerCase().includes("interface") || content.toLowerCase().includes("schema"),
      required: false, // Maybe warning
      actionText: "Add API section"
    },
    {
      id: "rollback",
      label: "Rollback Strategy",
      passed: content.toLowerCase().includes("rollback") || content.toLowerCase().includes("recovery"),
      required: false,
      actionText: "Add Rollback section"
    }
  ];

  const passedChecks = checks.filter(c => c.passed).length;
  const totalChecks = checks.length;
  const missingRequired = checks.some(c => c.required && !c.passed);
  
  return (
    <div className="w-full h-full flex flex-col bg-slate-50/50 dark:bg-[#0f111a]/50 p-5">
      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Spec Review</h3>
      
      <div className="flex-1 space-y-3">
        {checks.map(check => (
          <div key={check.id} className="group">
            <div className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${!check.passed && onAction ? 'hover:bg-slate-200 dark:hover:bg-white/5 cursor-pointer' : ''}`} onClick={() => !check.passed && onAction && onAction(check.id)}>
              <div className="mt-0.5">
                {check.passed ? (
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                ) : check.required ? (
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
                )}
              </div>
              <div className="flex flex-col">
                <span className={`text-sm font-medium ${check.passed ? 'text-slate-700 dark:text-slate-300' : 'text-slate-600 dark:text-slate-400'}`}>
                  {check.label}
                </span>
                {!check.passed && onAction && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex items-center gap-1 font-medium">
                    + {check.actionText}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {passedChecks} / {totalChecks} passed
          </span>
          {missingRequired && (
            <span className="text-[10px] uppercase font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">
              Requires Info
            </span>
          )}
        </div>
        
        <div className="relative group">
          <button
            onClick={onApprove}
            disabled={isLoading || missingRequired}
            className={`w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all ${
              missingRequired
                ? 'bg-slate-200 text-slate-400 dark:bg-white/5 dark:text-slate-600 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)]'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">Processing...</span>
            ) : missingRequired ? (
              "Missing Required Info"
            ) : (
              <>
                Approve <Check className="w-4 h-4" />
              </>
            )}
          </button>
          {missingRequired && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
              Resolve required checks above to approve
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, X, Search, FileEdit, CheckSquare, AlignLeft, Layers, Loader2 } from "lucide-react";

export const CopilotWidget = ({ workflowId }: { workflowId: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleAction = async (actionId: string, label: string) => {
    setLoadingAction(actionId);
    
    // Simulate AI processing for the UI redesign demo
    setTimeout(() => {
      setLoadingAction(null);
      setIsOpen(false);
      // Here you would dispatch an event or call an API
    }, 2000);
  };

  const actions = [
    { id: "ambiguities", icon: Search, label: "Find ambiguities", description: "Highlight unclear requirements" },
    { id: "improve-ac", icon: CheckSquare, label: "Improve acceptance criteria", description: "Generate testable criteria" },
    { id: "review-arch", icon: Layers, label: "Review architecture", description: "Check against system constraints" },
    { id: "explain", icon: AlignLeft, label: "Explain specification", description: "Summarize for non-technical stakeholders" },
    { id: "generate", icon: FileEdit, label: "Generate missing requirements", description: "Flesh out edge cases" },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2 z-50 font-medium text-sm"
      >
        <Sparkles className="w-4 h-4" /> SpecForge AI
      </button>
    );
  }

  return (
    <div ref={menuRef} className="fixed right-6 bottom-6 w-80 glass border border-white/20 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="bg-slate-900 p-4 flex items-center justify-between border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="font-bold text-sm text-white tracking-tight">Agent Actions</span>
        </div>
        <button 
          onClick={() => setIsOpen(false)} 
          className="p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-2 bg-slate-950/80 max-h-[400px] overflow-y-auto">
        <div className="space-y-1">
          {actions.map(action => {
            const Icon = action.icon;
            const isLoading = loadingAction === action.id;
            
            return (
              <button
                key={action.id}
                onClick={() => handleAction(action.id, action.label)}
                disabled={loadingAction !== null}
                className="w-full text-left p-3 rounded-xl hover:bg-white/5 transition-colors group flex items-start gap-3 disabled:opacity-50"
              >
                <div className={`mt-0.5 p-1.5 rounded-lg ${isLoading ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-500/20 transition-colors'}`}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                    {isLoading ? "Running agent..." : action.label}
                  </span>
                  <span className="text-xs text-slate-500 mt-0.5">
                    {action.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

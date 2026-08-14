"use client";

import React, { useState } from "react";
import { ChevronDown, Database, Brain, Network, FileText, Clock } from "lucide-react";
import { TabId } from "@/features/workflows/components/workflows/WorkflowTabs";

interface IntelligenceDrawerProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TOOLS = [
  { id: 'knowledge', label: 'Knowledge', icon: Database },
  { id: 'memory', label: 'Memory', icon: Brain },
  { id: 'graph', label: 'Graph', icon: Network },
  { id: 'traceability', label: 'Traceability', icon: FileText },
  { id: 'timeline', label: 'Timeline', icon: Clock },
] as const;

export function IntelligenceDrawer({ activeTab, onTabChange }: IntelligenceDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isActiveTool = TOOLS.some(t => t.id === activeTab);

  // Auto-open if an intelligence tab is currently active
  React.useEffect(() => {
    if (isActiveTool && !isOpen) {
      setIsOpen(true);
    }
  }, [isActiveTool, isOpen]);

  return (
    <div className="mb-6 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden glass transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors bg-white/50 dark:bg-black/20"
      >
        INTELLIGENCE
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="flex items-center gap-2 p-2 px-4 border-t border-slate-200 dark:border-white/10 overflow-x-auto scrollbar-hide">
          {TOOLS.map(tool => {
            const Icon = tool.icon;
            const isActive = activeTab === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => onTabChange(tool.id as TabId)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors shrink-0 ${
                  isActive
                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tool.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

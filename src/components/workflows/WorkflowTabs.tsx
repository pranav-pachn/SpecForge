"use client";

import { FileText, MessageSquare, Layers, ListTodo, Zap, CheckSquare, ShieldCheck, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

export type TabId = 'spec' | 'clarify' | 'plan' | 'tasks' | 'execute' | 'review' | 'validate' | 'drift';

interface WorkflowTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  workflow?: any;
}

const TABS = [
  { id: 'spec', label: 'Spec', icon: FileText, number: 1 },
  { id: 'clarify', label: 'Clarify', icon: MessageSquare, number: 2 },
  { id: 'plan', label: 'Plan', icon: Layers, number: 3 },
  { id: 'tasks', label: 'Tasks', icon: ListTodo, number: 4 },
  { id: 'execute', label: 'Execute', icon: Zap, number: 5 },
  { id: 'review', label: 'Review', icon: CheckSquare, number: 6 },
  { id: 'validate', label: 'Validate', icon: ShieldCheck, number: 7 },
  { id: 'drift', label: 'Drift', icon: Activity, number: 8 },
] as const;

export default function WorkflowTabs({ activeTab, onTabChange, workflow }: WorkflowTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation for tabs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if inside an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      const currentIndex = TABS.findIndex(t => t.id === activeTab);
      
      if (e.key === 'ArrowRight') {
        if (currentIndex < TABS.length - 1) {
          onTabChange(TABS[currentIndex + 1].id as TabId);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          onTabChange(TABS[currentIndex - 1].id as TabId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, onTabChange]);

  // Center active tab in scroll view on change
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const activeEl = scrollContainerRef.current.querySelector('[data-state="active"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

  const getTabStatusIndicator = (tabId: TabId) => {
    if (!workflow || !workflow.artifacts) return null;
    
    const getVersionStatus = (type: string) => {
      const artifact = workflow.artifacts.find((a: any) => a.type === type);
      return artifact?.versions?.[0]?.status;
    };

    let status = null;
    if (tabId === 'spec') status = getVersionStatus('SPEC');
    if (tabId === 'plan') status = getVersionStatus('PLAN');
    // For MVP, we'll just show status for spec and plan where artifacts definitely exist
    
    if (!status) return null;

    const colorClass = 
      status === 'APPROVED' ? 'bg-green-500' :
      status === 'STALE' ? 'bg-red-500' :
      status === 'NEEDS_REVIEW' ? 'bg-yellow-500' :
      'bg-slate-400 dark:bg-slate-500';
      
    return <div className={`w-2 h-2 rounded-full ${colorClass} shrink-0 ml-2`} title={`Status: ${status}`} />;
  };

  return (
    <div 
      ref={scrollContainerRef}
      className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 p-1 mb-6 scrollbar-hide relative"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            data-state={isActive ? "active" : "inactive"}
            onClick={() => onTabChange(tab.id as TabId)}
            className={cn(
              "group relative flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all whitespace-nowrap overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              isActive 
                ? "text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10" 
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50"
            )}
          >
            {/* Animated Bottom Border */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500 rounded-t-full transition-all duration-300" />
            )}
            
            <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-500")} />
            <span>{tab.label}</span>
            {getTabStatusIndicator(tab.id as TabId)}
            <span className={cn(
              "ml-1 text-[10px] px-1.5 rounded-md font-mono transition-colors",
              isActive ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 opacity-0 group-hover:opacity-100"
            )}>
              {tab.number}
            </span>
          </button>
        );
      })}
    </div>
  );
}

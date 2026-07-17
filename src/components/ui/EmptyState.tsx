import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 md:p-20 text-center glass border border-dashed border-slate-300 dark:border-white/10 rounded-2xl animate-in", className)}>
      <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-slate-500 dark:text-slate-400 shadow-sm border border-slate-200 dark:border-white/5">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
        {title}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm leading-relaxed">
        {description}
      </p>
      
      {action && (
        <button
          onClick={action.onClick}
          disabled={action.disabled || action.loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          {action.loading && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {action.label}
        </button>
      )}
    </div>
  );
}

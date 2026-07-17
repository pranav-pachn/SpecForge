"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { logger } from "@/lib/logger";

export default function WorkflowError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    logger.error("Workflow tab error", { error: error.message, stack: error.stack, digest: error.digest });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 glass border-red-500/20 border rounded-2xl animate-in fade-in">
      <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 text-red-500 shadow-sm border border-red-500/20">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
        Something went wrong!
      </h2>
      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md text-center leading-relaxed">
        An unexpected error occurred while loading this workflow tab. Our team has been notified.
      </p>
      
      <button
        onClick={() => reset()}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20 active:scale-95"
      >
        <RefreshCcw className="w-4 h-4" />
        Try again
      </button>
      
      {process.env.NODE_ENV !== "production" && (
        <div className="mt-8 p-4 bg-slate-950 rounded-lg max-w-2xl w-full overflow-auto">
          <p className="text-red-400 font-mono text-xs">{error.message}</p>
          <pre className="text-slate-500 font-mono text-[10px] mt-2 whitespace-pre-wrap">
            {error.stack}
          </pre>
        </div>
      )}
    </div>
  );
}

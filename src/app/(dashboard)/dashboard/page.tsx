"use client";

import { useEffect, useState } from "react";
import { Plus, ArrowRight } from "lucide-react";
import CreateWorkflowModal from "@/components/workflows/CreateWorkflowModal";
import { WorkflowStatus } from "@prisma/client";
import { WORKFLOW_STATUS_LABELS, WORKFLOW_STATUS_COLORS } from "@/lib/constants";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const res = await fetch("/api/workflows");
        if (res.ok) {
          const data = await res.json();
          setWorkflows(data);
        }
      } catch (err) {
        console.error("Failed to load workflows");
      } finally {
        setLoading(false);
      }
    };
    
    // Initial fetch
    fetchWorkflows();
    
    // In a real app we might use SWR or React Query, but we just re-fetch on focus for MVP
    const onFocus = () => fetchWorkflows();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Active Workflows</h1>
          <p className="text-slate-500">Manage your feature delivery pipelines.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Workflow
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-5 h-32 animate-pulse bg-slate-50 dark:bg-slate-900" />
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <div className="border-2 border-dashed rounded-xl p-12 text-center bg-slate-50 dark:bg-slate-900/50">
          <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Start by creating a new workflow to turn your raw feature idea into a structured specification.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 border shadow-sm px-4 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 font-medium mx-auto transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Your First Workflow
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((wf) => (
            <Link 
              href={`/workflow/${wf.id}`} 
              key={wf.id}
              className="border rounded-lg p-5 bg-white dark:bg-slate-950 hover:shadow-md transition-shadow group flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg truncate pr-4">{wf.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${WORKFLOW_STATUS_COLORS[wf.status as WorkflowStatus]}`}>
                  {WORKFLOW_STATUS_LABELS[wf.status as WorkflowStatus]}
                </span>
              </div>
              
              <div className="mt-auto flex items-center justify-between text-sm text-slate-500 pt-4 border-t">
                <span>Updated {formatDistanceToNow(new Date(wf.updatedAt))} ago</span>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600" />
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateWorkflowModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
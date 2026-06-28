"use client";

import { useEffect, useState } from "react";
import { Plus, ArrowRight, Hammer, CheckCircle2, AlertTriangle, Layers } from "lucide-react";
import CreateWorkflowModal from "@/components/workflows/CreateWorkflowModal";
import { WorkflowStatus } from "@prisma/client";
import { WORKFLOW_STATUS_LABELS, WORKFLOW_STATUS_COLORS } from "@/lib/constants";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, stale: 0 });

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const res = await fetch("/api/workflows");
        if (res.ok) {
          const data = await res.json();
          setWorkflows(data);
          
          // Calculate stats
          const active = data.filter((w: any) => w.status !== 'COMPLETED' && w.status !== 'ARCHIVED').length;
          const completed = data.filter((w: any) => w.status === 'COMPLETED').length;
          const stale = data.filter((w: any) => w.artifacts?.some((a: any) => a.versions?.[0]?.status === "STALE")).length;
          
          setStats({ total: data.length, active, completed, stale });
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
    <div className="max-w-6xl mx-auto py-8 px-4 animate-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 mb-1">
            Active Workflows
          </h1>
          <p className="text-slate-500 font-medium">Manage your feature delivery pipelines.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 font-medium transition-all shadow-sm hover:shadow hover:scale-105"
        >
          <Plus className="h-4 w-4" />
          New Workflow
        </button>
      </div>

      {/* Stats Bar */}
      {!loading && workflows.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-up">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg"><Layers className="w-5 h-5" /></div>
            <div><p className="text-sm font-medium text-slate-500">Total</p><p className="text-2xl font-bold">{stats.total}</p></div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg"><Hammer className="w-5 h-5" /></div>
            <div><p className="text-sm font-medium text-slate-500">Active</p><p className="text-2xl font-bold">{stats.active}</p></div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div>
            <div><p className="text-sm font-medium text-slate-500">Completed</p><p className="text-2xl font-bold">{stats.completed}</p></div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
            <div><p className="text-sm font-medium text-slate-500">Drifted</p><p className="text-2xl font-bold">{stats.stale}</p></div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 h-48 animate-pulse bg-white/50 dark:bg-slate-900/50" />
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center bg-white dark:bg-slate-900 shadow-sm animate-up">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Hammer className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Forge Your First Feature</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg">
            Start by creating a new workflow to turn your raw feature idea into a structured specification and execution plan.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white shadow-md px-6 py-3 rounded-lg hover:bg-blue-700 font-medium mx-auto transition-all hover:scale-105"
          >
            <Plus className="h-5 w-5" />
            Create Workflow
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          {workflows.map((wf) => {
            const hasStale = wf.artifacts?.some((a: any) => a.versions?.[0]?.status === "STALE");
            
            return (
              <Link 
                href={`/workflow/${wf.id}`} 
                key={wf.id}
                className="border border-slate-200 dark:border-slate-800 rounded-xl p-6 bg-white dark:bg-slate-900 hover:shadow-lg transition-all group flex flex-col relative overflow-hidden hover:-translate-y-1"
              >
                {hasStale && (
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-orange-400 to-orange-500" title="Contains stale artifacts" />
                )}
                
                <div className="flex justify-between items-start mb-5 gap-4">
                  <h3 className="font-bold text-lg leading-tight line-clamp-2">{wf.name}</h3>
                  <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold whitespace-nowrap shadow-sm border ${WORKFLOW_STATUS_COLORS[wf.status as WorkflowStatus]} ${wf.status === 'COMPLETED' ? 'border-green-200 dark:border-green-800' : 'border-transparent'}`}>
                    {WORKFLOW_STATUS_LABELS[wf.status as WorkflowStatus]}
                  </span>
                </div>
                
                <div className="mb-6 flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Artifacts</span>
                  <div className="flex -space-x-1.5">
                    {wf.artifacts?.length === 0 && <span className="text-xs text-slate-400 font-medium">None</span>}
                    {wf.artifacts?.map((a: any) => {
                      const vStatus = a.versions?.[0]?.status || "DRAFT";
                      const color = vStatus === "APPROVED" ? "bg-green-500" :
                                    vStatus === "NEEDS_REVIEW" ? "bg-yellow-500" :
                                    vStatus === "STALE" ? "bg-orange-500" :
                                    "bg-slate-300 dark:bg-slate-600";
                      return (
                        <div key={a.id} className={`w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm ${color}`} title={`${a.type}: ${vStatus}`} />
                      );
                    })}
                  </div>
                </div>
                
                <div className="mt-auto flex items-center justify-between text-xs text-slate-500 pt-5 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-medium">Updated {formatDistanceToNow(new Date(wf.updatedAt))} ago</span>
                  <ArrowRight className="h-4 w-4 transform translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all text-blue-600" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <CreateWorkflowModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
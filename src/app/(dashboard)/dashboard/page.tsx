"use client";

import { useEffect, useState } from "react";
import { Plus, ArrowRight, Hammer, CheckCircle2, AlertTriangle, Layers, Trash2 } from "lucide-react";
import CreateWorkflowModal from "@/features/workflows/components/workflows/CreateWorkflowModal";
import { WorkflowStatus } from "@prisma/client";
import { WORKFLOW_STATUS_LABELS, WORKFLOW_STATUS_COLORS } from "@/lib/constants";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, stale: 0 });

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

  useEffect(() => {
    // Initial fetch
    fetchWorkflows();
    
    // In a real app we might use SWR or React Query, but we just re-fetch on focus for MVP
    window.addEventListener("focus", fetchWorkflows);
    return () => window.removeEventListener("focus", fetchWorkflows);
  }, []);

  const handleDeleteWorkflow = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this workflow? This action cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/workflows/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchWorkflows();
      } else {
        console.error("Failed to delete workflow");
      }
    } catch (err) {
      console.error("Error deleting workflow", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 mb-2">
            Active Workflows
          </h1>
          <p className="text-slate-400 font-medium">Manage your feature delivery pipelines.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-blue-500 hover:to-indigo-500 font-bold transition-all duration-300 shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] hover:-translate-y-0.5"
        >
          <Plus className="h-5 w-5" />
          New Workflow
        </button>
      </div>

      {/* Stats Bar */}
      {!loading && workflows.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 animate-up">
          <div className="glass rounded-2xl p-5 flex items-center gap-4 hover:bg-white/10 transition-colors">
            <div className="p-3.5 bg-blue-500/20 text-blue-400 rounded-xl shadow-[inset_0_0_20px_rgba(59,130,246,0.2)]"><Layers className="w-6 h-6" /></div>
            <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total</p><p className="text-3xl font-extrabold text-white">{stats.total}</p></div>
          </div>
          <div className="glass rounded-2xl p-5 flex items-center gap-4 hover:bg-white/10 transition-colors">
            <div className="p-3.5 bg-indigo-500/20 text-indigo-400 rounded-xl shadow-[inset_0_0_20px_rgba(99,102,241,0.2)]"><Hammer className="w-6 h-6" /></div>
            <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active</p><p className="text-3xl font-extrabold text-white">{stats.active}</p></div>
          </div>
          <div className="glass rounded-2xl p-5 flex items-center gap-4 hover:bg-white/10 transition-colors">
            <div className="p-3.5 bg-green-500/20 text-green-400 rounded-xl shadow-[inset_0_0_20px_rgba(34,197,94,0.2)]"><CheckCircle2 className="w-6 h-6" /></div>
            <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed</p><p className="text-3xl font-extrabold text-white">{stats.completed}</p></div>
          </div>
          <div className="glass rounded-2xl p-5 flex items-center gap-4 hover:bg-white/10 transition-colors">
            <div className="p-3.5 bg-orange-500/20 text-orange-400 rounded-xl shadow-[inset_0_0_20px_rgba(249,115,22,0.2)]"><AlertTriangle className="w-6 h-6" /></div>
            <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Drifted</p><p className="text-3xl font-extrabold text-white">{stats.stale}</p></div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-2xl p-6 h-52 animate-pulse bg-white/5" />
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-up border-white/10">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[inset_0_0_30px_rgba(59,130,246,0.2)]">
            <Hammer className="w-12 h-12" />
          </div>
          <h3 className="text-3xl font-bold mb-4 text-white tracking-tight">Forge Your First Feature</h3>
          <p className="text-slate-400 mb-10 max-w-lg mx-auto text-lg leading-relaxed">
            Start by creating a new workflow to turn your raw feature idea into a structured specification and execution plan.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] px-8 py-3.5 rounded-xl hover:from-blue-500 hover:to-indigo-500 font-bold mx-auto transition-all duration-300 hover:scale-105"
          >
            <Plus className="h-6 w-6" />
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
                className="glass rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group flex flex-col relative overflow-hidden hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(59,130,246,0.3)] hover:border-blue-500/30"
              >
                {hasStale && (
                  <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-orange-400 to-red-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]" title="Contains stale artifacts" />
                )}
                
                <div className="flex justify-between items-start mb-6 gap-4">
                  <h3 className="font-extrabold text-xl leading-tight line-clamp-2 text-white group-hover:text-blue-100 transition-colors">{wf.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold whitespace-nowrap shadow-sm border ${WORKFLOW_STATUS_COLORS[wf.status as WorkflowStatus]} ${wf.status === 'COMPLETED' ? 'border-green-200 dark:border-green-800' : 'border-transparent'}`}>
                      {WORKFLOW_STATUS_LABELS[wf.status as WorkflowStatus]}
                    </span>
                    <button 
                      onClick={(e) => handleDeleteWorkflow(e, wf.id)}
                      className="p-1.5 rounded-md hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors shadow-sm"
                      title="Delete Workflow"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mb-8 flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Artifacts</span>
                  <div className="flex -space-x-2">
                    {wf.artifacts?.length === 0 && <span className="text-xs text-slate-500 font-medium">None</span>}
                    {wf.artifacts?.map((a: any) => {
                      const vStatus = a.versions?.[0]?.status || "DRAFT";
                      const color = vStatus === "APPROVED" ? "bg-green-500" :
                                    vStatus === "NEEDS_REVIEW" ? "bg-yellow-500" :
                                    vStatus === "STALE" ? "bg-orange-500" :
                                    "bg-slate-600";
                      return (
                        <div key={a.id} className={`w-6 h-6 rounded-full border-2 border-[#12141f] shadow-sm ${color}`} title={`${a.type}: ${vStatus}`} />
                      );
                    })}
                  </div>
                </div>
                
                <div className="mt-auto flex items-center justify-between text-xs text-slate-400 pt-5 border-t border-white/5">
                  <span className="font-medium">Updated {formatDistanceToNow(new Date(wf.updatedAt))} ago</span>
                  <ArrowRight className="h-5 w-5 transform translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 text-blue-400" />
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
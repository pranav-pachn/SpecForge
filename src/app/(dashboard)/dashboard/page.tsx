"use client";

import { useEffect, useState } from "react";
import { DashboardComposer } from "@/features/dashboard/components/DashboardComposer";
import { DashboardStats } from "@/features/dashboard/components/DashboardStats";
import { WorkflowPipelineCard } from "@/features/dashboard/components/WorkflowPipelineCard";
import { ActivityFeed } from "@/features/dashboard/components/ActivityFeed";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, drift: 0, avgValidation: null as number | null });

  const fetchWorkflows = async () => {
    try {
      const res = await fetch("/api/workflows");
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data);
        
        // Calculate stats
        const active = data.filter((w: any) => w.status !== 'COMPLETED' && w.status !== 'ARCHIVED').length;
        const drift = data.filter((w: any) => w.artifacts?.some((a: any) => a.versions?.[0]?.status === "STALE")).length;
        
        // Calculate validation score if simulation reports exist
        const withReports = data.filter((w: any) => w.simulationReport?.summary?.confidence != null);
        const avgVal = withReports.length > 0 
          ? withReports.reduce((acc: number, w: any) => acc + w.simulationReport.summary.confidence, 0) / withReports.length
          : null;

        setStats({ total: data.length, active, drift, avgValidation: avgVal });
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

  const userName = session?.user?.name?.split(" ")[0] || "there";

  const greeting = new Date().getHours() < 12 
    ? "Good morning" 
    : new Date().getHours() < 18 
      ? "Good afternoon" 
      : "Good evening";

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-in">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
          {greeting}, {userName}.
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
          What are you building today?
        </p>
      </div>

      <div className="mb-12 animate-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
        <DashboardComposer />
      </div>

      {!loading && (
        <div className="mb-12">
          <DashboardStats 
            totalWorkflows={stats.total} 
            activeWorkflows={stats.active}
            driftCount={stats.drift}
            avgValidation={stats.avgValidation}
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : workflows.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">
              Workflows
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
              {workflows.map(wf => (
                <WorkflowPipelineCard key={wf.id} workflow={wf} />
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-1 animate-up" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
            <ActivityFeed workflows={workflows} />
          </div>
        </div>
      )}
    </div>
  );
}
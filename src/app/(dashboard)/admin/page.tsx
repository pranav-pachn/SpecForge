"use client";

import { useEffect, useState } from "react";
import { Activity, Database, GitMerge, Server, Workflow } from "lucide-react";

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/admin/overview");
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return <div className="p-8 text-center text-slate-400">Loading metrics...</div>;
  }

  const cards = [
    { label: "Running Workflows", value: data?.workflows?.running, icon: Activity, color: "text-blue-400" },
    { label: "Completed Workflows", value: data?.workflows?.completed, icon: Workflow, color: "text-green-400" },
    { label: "Total Events", value: data?.metrics?.events, icon: GitMerge, color: "text-purple-400" },
    { label: "Decisions", value: data?.metrics?.decisions, icon: Database, color: "text-amber-400" },
    { label: "Vectors", value: data?.metrics?.vectors, icon: Server, color: "text-teal-400" },
    { label: "Active Providers", value: data?.metrics?.providers, icon: Activity, color: "text-rose-400" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="glass-panel p-6 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">{card.label}</p>
              <p className="text-3xl font-bold text-slate-100">{card.value !== undefined ? card.value : "-"}</p>
            </div>
            <div className={`p-4 rounded-xl bg-slate-800/50 ${card.color}`}>
              <card.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">PostgreSQL Status</h3>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${data?.health?.postgres ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-slate-300 font-medium">
              {data?.health?.postgres ? "Healthy and Connected" : "Connection Failed"}
            </span>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Redis Status</h3>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${data?.health?.redis ? "bg-green-500" : "bg-slate-500"}`} />
            <span className="text-slate-300 font-medium">
              {data?.health?.redis ? "Healthy and Connected" : "Disabled (Sync Transport Active)"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, XCircle, PauseCircle, Activity } from "lucide-react";

export default function RuntimePage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/admin/runtime");
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return <div className="p-8 text-center text-slate-400">Loading runtime data...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-200">Execution Engine Status</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-panel p-4 rounded-xl flex flex-col items-center justify-center text-center">
          <Activity className="w-5 h-5 text-blue-400 mb-2" />
          <span className="text-2xl font-bold text-slate-200">{data.agents.running}</span>
          <span className="text-xs text-slate-400 uppercase tracking-wider">Running</span>
        </div>
        <div className="glass-panel p-4 rounded-xl flex flex-col items-center justify-center text-center">
          <CheckCircle2 className="w-5 h-5 text-green-400 mb-2" />
          <span className="text-2xl font-bold text-slate-200">{data.agents.completed}</span>
          <span className="text-xs text-slate-400 uppercase tracking-wider">Completed</span>
        </div>
        <div className="glass-panel p-4 rounded-xl flex flex-col items-center justify-center text-center">
          <XCircle className="w-5 h-5 text-red-400 mb-2" />
          <span className="text-2xl font-bold text-slate-200">{data.agents.failed}</span>
          <span className="text-xs text-slate-400 uppercase tracking-wider">Failed</span>
        </div>
        <div className="glass-panel p-4 rounded-xl flex flex-col items-center justify-center text-center">
          <PauseCircle className="w-5 h-5 text-amber-400 mb-2" />
          <span className="text-2xl font-bold text-slate-200">{data.agents.paused}</span>
          <span className="text-xs text-slate-400 uppercase tracking-wider">Paused</span>
        </div>
        <div className="glass-panel p-4 rounded-xl flex flex-col items-center justify-center text-center">
          <Clock className="w-5 h-5 text-slate-400 mb-2" />
          <span className="text-2xl font-bold text-slate-200">{data.agents.cancelled}</span>
          <span className="text-xs text-slate-400 uppercase tracking-wider">Cancelled</span>
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-200 mt-8 mb-4">Runtime Health</h3>
      <div className="glass-panel p-6 rounded-2xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.entries(data.health).map(([key, val]) => (
          <div key={key} className="flex flex-col">
            <span className="text-slate-400 text-xs font-medium uppercase mb-1">{key}</span>
            <span className={`text-sm font-bold ${val ? 'text-green-400' : 'text-red-400'}`}>
              {val ? "READY" : "OFFLINE"}
            </span>
          </div>
        ))}
      </div>

      <h3 className="text-lg font-bold text-slate-200 mt-8 mb-4">Active Workflows (Execution Graphs)</h3>
      {data.workflows.length > 0 ? (
        <div className="space-y-4">
          {data.workflows.map((wf: any) => (
            <div key={wf.id} className="glass-panel p-4 rounded-2xl border-l-4 border-l-blue-500">
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-sm text-slate-300">{wf.id}</span>
                <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-bold animate-pulse">RUNNING</span>
              </div>
              <p className="text-sm text-slate-400 truncate">{wf.goal || "No goal specified"}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-8 text-center text-slate-500 rounded-2xl">
          No active execution graphs.
        </div>
      )}
    </div>
  );
}

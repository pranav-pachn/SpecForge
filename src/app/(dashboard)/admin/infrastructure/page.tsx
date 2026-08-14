"use client";

import { useEffect, useState } from "react";
import { Database, Server, Cpu, Layers } from "lucide-react";

export default function InfrastructurePage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/admin/infrastructure");
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

  if (!data) return <div className="p-8 text-center text-slate-400">Loading infrastructure data...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Postgres */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-slate-200">PostgreSQL</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Status</span>
              <span className={`font-medium ${data.postgres.status === 'Connected' ? 'text-green-400' : 'text-red-400'}`}>
                {data.postgres.status}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Latency</span>
              <span className="font-medium text-slate-200">{data.postgres.latencyMs} ms</span>
            </div>
          </div>
        </div>

        {/* Redis */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Server className="w-6 h-6 text-red-400" />
            <h2 className="text-xl font-bold text-slate-200">Redis & Queue</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Status</span>
              <span className={`font-medium ${data.redis.status === 'Connected' ? 'text-green-400' : 'text-slate-400'}`}>
                {data.redis.status}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Latency</span>
              <span className="font-medium text-slate-200">{data.redis.latencyMs} ms</span>
            </div>
            <div className="h-px bg-slate-800 my-2" />
            <div className="flex justify-between items-center">
              <span className="text-slate-400">BullMQ Active Workers</span>
              <span className="font-medium text-slate-200">{data.bullmq.activeWorkers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Queue Length</span>
              <span className="font-medium text-slate-200">{data.bullmq.queueLength}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Dead Letter Queue</span>
              <span className="font-medium text-slate-200">{data.bullmq.deadLetterQueue}</span>
            </div>
          </div>
        </div>

        {/* Extensions */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Layers className="w-6 h-6 text-teal-400" />
            <h2 className="text-xl font-bold text-slate-200">pgvector</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Status</span>
              <span className={`font-medium ${data.pgvector.status === 'Active' ? 'text-green-400' : 'text-slate-400'}`}>
                {data.pgvector.status}
              </span>
            </div>
          </div>
        </div>

        {/* Environment */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-slate-200">Environment</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(data.env).map(([key, val]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-slate-400 text-sm font-mono">{key}</span>
                <span className={`text-sm font-medium ${val === 'Set' ? 'text-green-400' : 'text-slate-300'}`}>
                  {String(val)}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

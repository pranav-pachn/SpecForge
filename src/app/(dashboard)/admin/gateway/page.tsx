"use client";

import { useEffect, useState } from "react";
import { Key, Activity, Zap, AlertTriangle } from "lucide-react";

export default function GatewayPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/admin/gateway");
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

  if (!data) return <div className="p-8 text-center text-slate-400">Loading gateway data...</div>;

  return (
    <div className="space-y-8">
      
      {/* Provider Metrics */}
      <div>
        <h2 className="text-xl font-bold text-slate-200 mb-4">Provider Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.providers.map((p: any) => (
            <div key={p.id} className="glass-panel p-5 rounded-2xl">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-slate-200 capitalize">{p.id}</h3>
                {p.circuitOpen ? (
                  <span className="flex items-center gap-1 text-xs font-bold bg-red-500/20 text-red-400 px-2 py-1 rounded">
                    <AlertTriangle className="w-3 h-3" />
                    CIRCUIT OPEN
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded">
                    <Activity className="w-3 h-3" />
                    HEALTHY
                  </span>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Avg Latency</span>
                  <span className="text-slate-200 font-mono">{p.averageLatencyMs.toFixed(0)} ms</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Failure Rate</span>
                  <span className="text-slate-200 font-mono">{(p.failureRate * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Active Keys</span>
                  <span className="text-slate-200 font-mono flex items-center gap-1">
                    <Key className="w-3 h-3" />
                    {data.keys[p.id] || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Routing Table */}
      <div>
        <h2 className="text-xl font-bold text-slate-200 mb-4">Capability Routing Table</h2>
        <div className="glass-panel rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 font-medium">Capability</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Routed Provider</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {data.capabilities.map((cap: any) => (
                <tr key={cap.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-mono text-purple-400">{cap.id}</td>
                  <td className="px-4 py-3 text-slate-400">{cap.name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700 capitalize">
                      <Zap className="w-3 h-3 text-amber-400" />
                      {cap.routedProvider}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

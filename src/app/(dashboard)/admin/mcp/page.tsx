"use client";

import { useState, useEffect } from "react";
import { Terminal, ShieldAlert, Cpu, Activity, Database, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function MCPExplorerPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/mcp")
      .then(r => r.json())
      .then(d => setData(d))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-200">MCP Broker (Tool OS)</h2>
          <p className="text-slate-400 text-sm">Monitor and manage connected tool systems</p>
        </div>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-3 gap-6">
            {data.connectors.map((c: any) => (
              <div key={c.id} className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-500/10 rounded-lg">
                        <Terminal className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-200">{c.name}</h3>
                        <p className="text-xs text-slate-500 uppercase">{c.type}</p>
                      </div>
                    </div>
                    {c.health.isAvailable ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {c.capabilities.slice(0, 3).map((cap: string) => (
                      <span key={cap} className="text-[10px] px-2 py-1 bg-slate-800 text-slate-300 rounded font-mono">
                        {cap}
                      </span>
                    ))}
                    {c.capabilities.length > 3 && (
                      <span className="text-[10px] px-2 py-1 bg-slate-800 text-slate-400 rounded font-mono">
                        +{c.capabilities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800/50">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Latency (EMA)</p>
                    <p className="text-sm font-medium text-slate-300">{c.health.latencyMs}ms</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Failures / Req</p>
                    <p className="text-sm font-medium text-slate-300">{c.health.failures} / {c.health.totalRequests}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" /> Recent Executions
            </h3>
            <div className="overflow-hidden bg-slate-900/50 rounded-xl border border-slate-800/50">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 border-b border-slate-800/50">
                  <tr>
                    <th className="p-3 text-slate-400 font-medium">Time</th>
                    <th className="p-3 text-slate-400 font-medium">Connector</th>
                    <th className="p-3 text-slate-400 font-medium">Capability</th>
                    <th className="p-3 text-slate-400 font-medium">Status</th>
                    <th className="p-3 text-slate-400 font-medium text-right">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {data.executions.length === 0 ? (
                    <tr><td colSpan={5} className="p-4 text-center text-slate-500">No recent executions</td></tr>
                  ) : (
                    data.executions.map((exe: any) => (
                      <tr key={exe.id}>
                        <td className="p-3 text-slate-400 text-xs">
                          {format(new Date(exe.createdAt), "HH:mm:ss.SSS")}
                        </td>
                        <td className="p-3 font-medium text-slate-300">
                          {exe.connector}
                        </td>
                        <td className="p-3 font-mono text-xs text-blue-400">
                          {exe.capability}
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold ${
                            exe.status === 'SUCCESS' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {exe.status}
                          </span>
                          {exe.cached && (
                            <span className="ml-2 text-[10px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded">
                              CACHED
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-400 text-right">
                          {exe.latency}ms
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

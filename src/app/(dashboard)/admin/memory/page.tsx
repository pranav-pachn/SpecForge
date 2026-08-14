"use client";

import { useEffect, useState } from "react";
import { GitCommit, Search, Link as LinkIcon, Network, Activity } from "lucide-react";

export default function MemoryPage() {
  const [data, setData] = useState<any>(null);
  const [workflowId, setWorkflowId] = useState("");

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/admin/memory${workflowId ? `?workflowId=${workflowId}` : ''}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [workflowId]);

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <h2 className="text-xl font-bold text-slate-200">Engineering Memory & Graph</h2>
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Filter by Workflow ID"
            value={workflowId}
            onChange={e => setWorkflowId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Decisions List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-300">Decisions Timeline</h3>
          
          <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
            {data?.decisions?.map((dec: any) => {
              const latest = dec.records?.[0];
              if (!latest) return null;

              return (
                <div key={dec.id} className="glass-panel p-5 rounded-2xl relative overflow-hidden">
                  {/* Confidence Bar */}
                  <div className="absolute top-0 left-0 h-1 bg-slate-800 w-full">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-green-400 transition-all"
                      style={{ width: `${(dec.confidence || 0) * 100}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-start mt-2 mb-3">
                    <div>
                      <h4 className="text-lg font-bold text-slate-200">{latest.title}</h4>
                      <div className="text-xs font-mono text-slate-500 mt-1 flex items-center gap-3">
                        <span>{dec.decisionId}</span>
                        <span className={`px-1.5 py-0.5 rounded ${
                          dec.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                          dec.status === 'SUPERSEDED' ? 'bg-slate-500/20 text-slate-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {dec.status}
                        </span>
                        <span className="text-green-400 flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          Conf: {dec.confidence?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 mb-4">{latest.summary}</p>
                  
                  <div className="space-y-3">
                    {latest.alternatives?.length > 0 && (
                      <div className="text-sm">
                        <span className="font-semibold text-slate-400 block mb-1">Alternatives Rejected:</span>
                        <ul className="list-disc pl-5 text-slate-400 space-y-1">
                          {latest.alternatives.filter((a:any)=>!a.accepted).map((a:any) => (
                            <li key={a.id}>{a.description}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {latest.risks?.length > 0 && (
                      <div className="text-sm">
                        <span className="font-semibold text-slate-400 block mb-1">Risks:</span>
                        <ul className="list-disc pl-5 text-slate-400 space-y-1">
                          {latest.risks.map((r:any) => (
                            <li key={r.id}>[{r.severity}] {r.description}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {latest.evidence?.length > 0 && (
                      <div className="text-sm">
                        <span className="font-semibold text-slate-400 block mb-1">Evidence:</span>
                        <ul className="list-disc pl-5 text-slate-400 space-y-1">
                          {latest.evidence.map((e:any) => (
                            <li key={e.id}>{e.type} from {e.source} ({e.reference})</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {/* Timeline representation */}
                  {(dec.supersedes || dec.supersededBy) && (
                    <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-2 text-xs font-mono text-slate-500">
                      <GitCommit className="w-4 h-4" />
                      {dec.supersedes && <span>Supersedes old decision</span>}
                      {dec.supersedes && dec.supersededBy && <span> | </span>}
                      {dec.supersededBy && <span className="text-red-400">Superseded by newer decision</span>}
                    </div>
                  )}
                </div>
              );
            })}
            {data?.decisions?.length === 0 && (
              <div className="p-8 text-center text-slate-500">No decisions found.</div>
            )}
          </div>
        </div>

        {/* Graph Edges */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-300">Entity Relationships Graph</h3>
            <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">
              {data?.edges?.length || 0} Edges
            </span>
          </div>
          
          {/* We'll use a simple table representation since react-force-graph isn't guaranteed to be installed properly in this container without modifying package.json and fixing potentially breaking versions. The prompt said "if available". Let's stick to reliable UI list. */}
          <div className="glass-panel overflow-hidden rounded-2xl">
            <div className="bg-slate-800/50 p-4 border-b border-slate-800 flex items-center gap-2 text-slate-400 text-sm">
              <Network className="w-4 h-4" />
              <span>Raw Edges (Source → Relation → Target)</span>
            </div>
            <div className="max-h-[700px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-slate-800/50">
                  {data?.edges?.map((edge: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                        {edge.sourceType} <span className="text-slate-500">({edge.sourceId.substring(0,8)}...)</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-400 px-2 py-1 rounded text-[10px] font-bold tracking-wider">
                          <LinkIcon className="w-3 h-3" />
                          {edge.relationType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs text-right">
                        {edge.targetType} <span className="text-slate-500">({edge.targetId.substring(0,8)}...)</span>
                      </td>
                    </tr>
                  ))}
                  {data?.edges?.length === 0 && (
                    <tr><td colSpan={3} className="p-8 text-center text-slate-500">No graph edges found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Network, Server, FileCode, GitBranch, Target, Zap, ChevronDown, ChevronRight, Activity, GitCommit } from "lucide-react";
import { format } from "date-fns";

export default function GraphExplorerPage() {
  const [stats, setStats] = useState<any>(null);
  const [impactNodeId, setImpactNodeId] = useState("");
  const [impactReport, setImpactReport] = useState<any>(null);
  const [coverageWorkflowId, setCoverageWorkflowId] = useState("");
  const [coverageReport, setCoverageReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/graph")
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(console.error);
  }, []);

  const handleImpact = async () => {
    if (!impactNodeId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/graph/impact", {
        method: "POST",
        body: JSON.stringify({ nodeId: impactNodeId })
      });
      const data = await res.json();
      setImpactReport(data);
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  }

  const handleCoverage = async () => {
    if (!coverageWorkflowId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/graph/coverage?workflowId=${coverageWorkflowId}`);
      const data = await res.json();
      setCoverageReport(data);
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-200">Engineering Knowledge Graph</h2>
          <p className="text-slate-400 text-sm">The Digital Twin of the Engineering System</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Server className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Total Nodes</p>
              <h3 className="text-2xl font-bold text-slate-200">{stats.nodeCount}</h3>
            </div>
          </div>
          <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Network className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Relationships</p>
              <h3 className="text-2xl font-bold text-slate-200">{stats.relationshipCount}</h3>
            </div>
          </div>
          <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-lg">
              <GitBranch className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Most Connected</p>
              <h3 className="text-sm font-bold text-slate-200 truncate max-w-[120px]" title={stats.mostConnected?.node?.title}>
                {stats.mostConnected?.node?.title || "N/A"}
              </h3>
            </div>
          </div>
          <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-lg">
              <Target className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Orphan Nodes</p>
              <h3 className="text-2xl font-bold text-slate-200">{stats.orphanCount}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" /> Impact Analysis
          </h3>
          <div className="flex items-center gap-3 mb-4">
            <input 
              type="text" 
              placeholder="Node ID..."
              value={impactNodeId}
              onChange={(e) => setImpactNodeId(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
            />
            <button 
              onClick={handleImpact}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg"
            >
              Analyze
            </button>
          </div>

          {impactReport && (
            <div className="bg-slate-900/50 rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Root Node: <strong className="text-slate-200">{impactReport.rootNode.title}</strong></span>
                <span className={`text-xs px-2 py-1 rounded font-bold ${
                  impactReport.blastRadius === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                  impactReport.blastRadius === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                  impactReport.blastRadius === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {impactReport.blastRadius} IMPACT
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-slate-800 rounded py-2">
                  <div className="font-bold text-slate-200">{impactReport.summary.files}</div>
                  <div className="text-slate-500">Files</div>
                </div>
                <div className="bg-slate-800 rounded py-2">
                  <div className="font-bold text-slate-200">{impactReport.summary.tasks}</div>
                  <div className="text-slate-500">Tasks</div>
                </div>
                <div className="bg-slate-800 rounded py-2">
                  <div className="font-bold text-slate-200">{impactReport.summary.decisions}</div>
                  <div className="text-slate-500">Decisions</div>
                </div>
                <div className="bg-slate-800 rounded py-2">
                  <div className="font-bold text-slate-200">{impactReport.summary.tests}</div>
                  <div className="text-slate-500">Tests</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" /> Coverage Analysis
          </h3>
          <div className="flex items-center gap-3 mb-4">
            <input 
              type="text" 
              placeholder="Workflow ID..."
              value={coverageWorkflowId}
              onChange={(e) => setCoverageWorkflowId(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
            />
            <button 
              onClick={handleCoverage}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg"
            >
              Analyze
            </button>
          </div>

          {coverageReport && (
            <div className="bg-slate-900/50 rounded-xl p-4 space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded py-2">
                  <div className="font-bold text-green-400">{coverageReport.covered}</div>
                  <div className="text-green-500/70">Fully Covered</div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded py-2">
                  <div className="font-bold text-amber-400">{coverageReport.partial}</div>
                  <div className="text-amber-500/70">Partial</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded py-2">
                  <div className="font-bold text-red-400">{coverageReport.uncovered.length - coverageReport.partial}</div>
                  <div className="text-red-500/70">Uncovered</div>
                </div>
              </div>

              {coverageReport.gaps.length > 0 && (
                <div className="text-sm">
                  <strong className="text-slate-300 block mb-2">Coverage Gaps:</strong>
                  <ul className="space-y-1">
                    {coverageReport.gaps.slice(0, 5).map((g: any, i: number) => (
                      <li key={i} className="text-xs text-slate-400 flex items-center justify-between">
                        <span>Node <span className="text-slate-500">{g.nodeId.substring(0,8)}...</span></span>
                        <span className="text-red-400 bg-red-400/10 px-2 py-0.5 rounded">Missing {g.missingLayer}</span>
                      </li>
                    ))}
                    {coverageReport.gaps.length > 5 && (
                      <li className="text-xs text-slate-500 text-center pt-2">...and {coverageReport.gaps.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

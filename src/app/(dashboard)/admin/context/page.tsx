"use client";

import { useState } from "react";
import { Search, Server, Cpu, Filter, Zap, AlignLeft } from "lucide-react";

export default function ContextPage() {
  const [prompt, setPrompt] = useState("Why did we choose Redis?");
  const [workflowId, setWorkflowId] = useState("TEST_WORKFLOW");
  const [capability, setCapability] = useState("ARCHITECTURE");
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTest = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, workflowId, capability })
      });
      const json = await res.json();
      setResult(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-slate-200 mb-4">Context Pipeline Trace</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Prompt Query</label>
            <input 
              type="text" 
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Workflow ID</label>
            <input 
              type="text" 
              value={workflowId}
              onChange={e => setWorkflowId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Capability Policy</label>
            <select 
              value={capability}
              onChange={e => setCapability(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
            >
              <option value="ARCHITECTURE">ARCHITECTURE (High Budget, All Sources)</option>
              <option value="SPECIFICATION">SPECIFICATION (RAG Only)</option>
              <option value="DEFAULT">DEFAULT (Standard)</option>
            </select>
          </div>
        </div>
        
        <button 
          onClick={handleTest}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {loading ? <Server className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Execute Context Build
        </button>
      </div>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Pipeline Trace Visualizer */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-bold text-slate-200">Pipeline Execution</h3>
            
            <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><Server className="w-4 h-4" /></div>
                <span className="font-medium text-slate-200">Retrieved</span>
              </div>
              <span className="text-xl font-bold text-slate-300">{result.trace.retrieved}</span>
            </div>
            
            <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg"><Filter className="w-4 h-4" /></div>
                <span className="font-medium text-slate-200">Filtered (Dupes)</span>
              </div>
              <span className="text-xl font-bold text-slate-300">{result.trace.filtered}</span>
            </div>
            
            <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg"><AlignLeft className="w-4 h-4" /></div>
                <span className="font-medium text-slate-200">Compressed</span>
              </div>
              <span className="text-xl font-bold text-slate-300">{result.trace.compressed}</span>
            </div>

            <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 text-red-400 rounded-lg"><Filter className="w-4 h-4" /></div>
                <span className="font-medium text-slate-200">Dropped (Budget)</span>
              </div>
              <span className="text-xl font-bold text-slate-300">{result.trace.dropped}</span>
            </div>

            <div className="glass-panel p-4 rounded-xl flex items-center justify-between border border-green-500/30 bg-green-500/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 text-green-400 rounded-lg"><Zap className="w-4 h-4" /></div>
                <span className="font-medium text-green-100">Final Tokens</span>
              </div>
              <span className="text-xl font-bold text-green-400">{result.trace.finalTokens}</span>
            </div>
          </div>

          {/* Retrieved Items */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-slate-200">Final Assembled Context ({result.items.length} items)</h3>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {result.items.map((item: any, i: number) => (
                <div key={i} className="glass-panel p-4 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700">
                        {item.provider}
                      </span>
                      <span className="text-xs text-slate-400">{item.retrievalMethod}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-blue-400">Score: {item.score.toFixed(3)}</div>
                      <div className="text-xs font-mono text-green-400">Conf: {item.confidence.toFixed(2)}</div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap font-mono mt-3 bg-slate-900/50 p-3 rounded border border-slate-800">
                    {item.preview}
                  </p>
                </div>
              ))}
              {result.items.length === 0 && (
                <div className="p-8 text-center text-slate-500">No context retrieved for this query.</div>
              )}
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}

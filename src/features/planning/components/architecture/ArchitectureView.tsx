"use client";

import { useState, useEffect } from "react";
import { Component, ArrowRight, Share2, Server, Database, Shield, LayoutTemplate, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export function ArchitectureView({ planArtifact, workflowId }: { planArtifact: any, workflowId: string }) {
  const [architecture, setArchitecture] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchArchitecture = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workflows/${workflowId}`);
      if (!res.ok) throw new Error("Failed to fetch workflow");
      const data = await res.json();
      
      const archArtifact = data.artifacts?.find((a: any) => a.type === "ARCHITECTURE");
      if (archArtifact && archArtifact.versions?.[0]) {
        try {
          const parsed = JSON.parse(archArtifact.versions[0].content);
          setArchitecture(parsed);
        } catch (e) {
          console.error("Failed to parse architecture json", e);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchitecture();
  }, [workflowId]);

  const handleGenerate = async () => {
    if (!planArtifact || !planArtifact.versions?.[0]) {
      toast.error("Plan artifact not found");
      return;
    }
    
    setGenerating(true);
    try {
      const res = await fetch(`/api/ai/architecture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId,
          planContent: planArtifact.versions[0].content,
          planVersionId: planArtifact.versions[0].id
        })
      });
      
      if (!res.ok) throw new Error("Failed to generate architecture");
      
      toast.success("Architecture generated successfully");
      await fetchArchitecture();
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate architecture");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#0f111a] rounded-2xl border border-slate-200 dark:border-white/10 p-12 flex justify-center shadow-sm">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!architecture) {
    return (
      <div className="bg-white dark:bg-[#0f111a] rounded-2xl border border-slate-200 dark:border-white/10 p-12 flex flex-col items-center justify-center shadow-sm text-center">
        <Share2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Architecture Generated</h3>
        <p className="text-slate-500 mb-6 max-w-md">Extract architectural components and data flows from your implementation plan.</p>
        <button 
          onClick={handleGenerate}
          disabled={generating}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Generate Architecture
        </button>
      </div>
    );
  }

  const getIconForType = (type: string) => {
    switch(type) {
      case 'client': return <LayoutTemplate className="w-4 h-4 text-blue-500" />;
      case 'database': return <Database className="w-4 h-4 text-purple-500" />;
      case 'worker': return <Server className="w-4 h-4 text-orange-500" />;
      case 'third-party': return <Component className="w-4 h-4 text-red-500" />;
      case 'service':
      default: return <Server className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="bg-white dark:bg-[#0f111a] rounded-2xl border border-slate-200 dark:border-white/10 p-8 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <Share2 className="w-5 h-5 text-blue-500" /> Architecture
          </h3>
          <p className="text-sm text-slate-500 mt-1">Component dependency graph and design decisions.</p>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Regenerate
        </button>
      </div>
      
      <div className="font-mono text-sm bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl p-8 mb-8">
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Components</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {architecture.components?.map((comp: any, i: number) => (
            <div key={i} className="bg-white dark:bg-[#1a1d2d] border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex flex-col gap-2 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                {getIconForType(comp.type)}
                {comp.name}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2" title={comp.description}>{comp.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      {architecture.dataFlows && architecture.dataFlows.length > 0 && (
        <div className="mb-8">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 ml-1">Data Flows</h4>
          <div className="space-y-3">
            {architecture.dataFlows.map((flow: any, i: number) => (
              <div key={i} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
                <div className="font-bold text-blue-600 dark:text-blue-400 w-1/4 text-right truncate" title={flow.source}>{flow.source}</div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="font-bold text-purple-600 dark:text-purple-400 w-1/4 truncate" title={flow.target}>{flow.target}</div>
                <div className="text-slate-500 dark:text-slate-400 flex-1 text-xs">{flow.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {architecture.decisions && architecture.decisions.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 ml-1">Key Decisions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {architecture.decisions.map((dec: any, i: number) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-800 dark:text-slate-200 mb-1">{dec.title}</div>
                <div className="text-slate-600 dark:text-slate-400 text-sm">{dec.rationale}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

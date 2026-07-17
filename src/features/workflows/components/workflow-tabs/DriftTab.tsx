"use client";

import { useEffect, useState } from "react";
import { Loader2, Route } from "lucide-react";
import { useRouter } from "next/navigation";

import DriftScoreHero from "@/features/workflows/components/drift/DriftScoreHero";
import VersionDiffPanel from "@/features/workflows/components/drift/VersionDiffPanel";
import ImpactGraphView from "@/features/workflows/components/drift/ImpactGraphView";
import RegenerationDialog from "@/features/workflows/components/drift/RegenerationDialog";

export default function DriftTab({ workflowId, onMutate }: { workflowId: string, onMutate?: () => void }) {
  const router = useRouter();
  const [data, setData] = useState<{events: any[], analysis: any}>({ events: [], analysis: null });
  const [loading, setLoading] = useState(true);
  
  // Selection state for ImpactGraph
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [workflowId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/drift?workflowId=${workflowId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        
        // Auto-select all stale nodes by default when data loads
        if (json.analysis && json.analysis.impactData) {
          try {
            const graph = JSON.parse(json.analysis.impactData);
            const staleIds: string[] = [];
            const collect = (node: any) => {
              if (node.status === "stale" && node.type !== "requirement") staleIds.push(node.id);
              if (node.children) node.children.forEach(collect);
            };
            graph.roots.forEach(collect);
            setSelectedNodes(staleIds);
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (id: string) => {
    setSelectedNodes(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleRegenerate = async () => {
    if (!data.analysis) return;
    setIsRegenerating(true);
    
    try {
      await fetch(`/api/drift/analysis/${data.analysis.id}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selections: selectedNodes })
      });
      
      await fetchData(); // Refresh data
      onMutate?.();
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Regeneration failed", err);
    } finally {
      setIsRegenerating(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  const { events, analysis } = data;

  if (!analysis && events.length === 0) {
    return (
      <div className="glass rounded-xl p-12 text-center animate-in shadow-[0_0_40px_rgba(0,0,0,0.3)] border-white/10">
        <Route className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">No Drift Detected</h3>
        <p className="text-slate-500 mb-6 max-w-lg mx-auto">
          Your pipeline is fully synchronized. There are no changes to upstream specifications or plans that have impacted downstream artifacts.
        </p>
      </div>
    );
  }

  let diffs = [];
  let graph = null;
  
  if (analysis) {
    try {
      if (analysis.diffData) diffs = JSON.parse(analysis.diffData);
      if (analysis.impactData) graph = JSON.parse(analysis.impactData);
    } catch (e) {
      console.error("Failed to parse analysis JSON", e);
    }
  }

  return (
    <div className="glass rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.3)] border-white/10 overflow-hidden pb-8 relative animate-up" style={{ animationDelay: '100ms' }}>
      <DriftScoreHero analysis={analysis} events={events} />
      
      {analysis && diffs.length > 0 && (
        <VersionDiffPanel diffs={diffs} />
      )}
      
      {analysis && graph && (
        <ImpactGraphView 
          graph={graph} 
          selectedNodes={selectedNodes} 
          onToggleNode={toggleNode} 
        />
      )}

      {analysis && analysis.status !== "RESOLVED" && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 glass-panel text-white px-6 py-4 rounded-full flex items-center gap-6 animate-up">
          <div className="text-sm font-medium">
            {selectedNodes.length > 0 ? (
              <><span className="font-bold text-purple-400">{selectedNodes.length}</span> artifacts selected for regeneration</>
            ) : (
              <span className="text-slate-400">No artifacts selected for regeneration</span>
            )}
          </div>
          <button 
            onClick={() => selectedNodes.length === 0 ? handleRegenerate() : setIsDialogOpen(true)}
            className="bg-purple-600 hover:bg-purple-500 px-5 py-2 rounded-full font-bold text-sm transition-colors"
          >
            {selectedNodes.length > 0 ? "Review & Regenerate" : "Acknowledge Drift"}
          </button>
        </div>
      )}

      <RegenerationDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        selectedCount={selectedNodes.length}
        onConfirm={handleRegenerate}
        isRegenerating={isRegenerating}
      />
    </div>
  );
}

"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import to avoid SSR issues with canvas
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface GraphData {
  nodes: any[];
  edges: any[];
}

export const GraphTab = ({ workflowId }: { workflowId: string }) => {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const fgRef = useRef<any>();

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const res = await fetch(`/api/workflows/${workflowId}/graph`);
        const json = await res.json();
        if (res.ok) {
          // react-force-graph expects `source` and `target` properties for links
          const formattedEdges = json.edges.map((e: any) => ({
            ...e,
            source: e.sourceId,
            target: e.targetId,
          }));
          setData({ nodes: json.nodes, edges: formattedEdges });
        }
      } catch (err) {
        console.error("Failed to load graph:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, [workflowId]);

  const getNodeColor = useCallback((node: any) => {
    switch (node.type) {
      case "REQUIREMENT": return "#3b82f6"; // blue
      case "TASK": return "#10b981"; // green
      case "DECISION": return "#f59e0b"; // amber
      case "ARCHITECTURE": return "#8b5cf6"; // purple
      default: return "#94a3b8"; // slate
    }
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center text-muted-foreground">
        <p>No engineering graph available yet.</p>
        <p className="text-sm">Run the workflow to populate the graph.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[800px] w-full rounded-xl border bg-card overflow-hidden">
      <ForceGraph2D
        ref={fgRef}
        graphData={{ nodes: data.nodes, links: data.edges }}
        nodeLabel="title"
        nodeColor={getNodeColor}
        linkColor={() => "rgba(100, 116, 139, 0.2)"} // slate-500 with opacity
        nodeRelSize={6}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        onEngineStop={() => fgRef.current?.zoomToFit(400)}
        width={1000} // Approximate or make responsive
        height={800}
      />
    </div>
  );
};

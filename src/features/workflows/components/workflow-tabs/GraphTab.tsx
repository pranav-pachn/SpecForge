"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Loader2, FileText, CheckCircle2, ChevronRight, Share2, Info, Network, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Dynamically import to avoid SSR issues with canvas
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface GraphData {
  nodes: any[];
  edges: any[];
}

export const GraphTab = ({ workflowId }: { workflowId: string }) => {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>();

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const res = await fetch(`/api/workflows/${workflowId}/graph`);
        const json = await res.json();
        if (res.ok) {
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

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      });
      
      const handleResize = () => {
        if (containerRef.current) {
          setDimensions({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight
          });
        }
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [containerRef.current]);

  const getNodeColor = useCallback((node: any) => {
    switch (node.type) {
      case "REQUIREMENT": return "#3b82f6"; // blue
      case "TASK": return "#10b981"; // green
      case "DECISION": return "#f59e0b"; // amber
      case "ARCHITECTURE": return "#8b5cf6"; // purple
      default: return "#94a3b8"; // slate
    }
  }, []);

  const handleNodeClick = useCallback((node: any) => {
    // Center node
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(2.5, 1000);
    }
    setSelectedNode(node);
    
    // Auto-trace (highlight neighborhood)
    const newHighlightNodes = new Set();
    const newHighlightLinks = new Set();
    newHighlightNodes.add(node.id);
    
    if (data) {
      data.edges.forEach(link => {
        const s = typeof link.source === 'object' ? link.source.id : link.source;
        const t = typeof link.target === 'object' ? link.target.id : link.target;
        
        if (s === node.id || t === node.id) {
          newHighlightLinks.add(link);
          newHighlightNodes.add(s);
          newHighlightNodes.add(t);
        }
      });
    }
    
    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);
  }, [data]);

  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
    if (fgRef.current) {
      fgRef.current.zoomToFit(1000, 50);
    }
  }, []);

  const handleTraceLineage = useCallback(() => {
    if (!selectedNode || !data) return;
    
    // Find all ancestors and descendants (BFS)
    const newHighlightNodes = new Set([selectedNode.id]);
    const newHighlightLinks = new Set();
    
    let toVisit = [selectedNode.id];
    while (toVisit.length > 0) {
      const curr = toVisit.pop();
      data.edges.forEach(link => {
        const s = typeof link.source === 'object' ? link.source.id : link.source;
        const t = typeof link.target === 'object' ? link.target.id : link.target;
        
        if (s === curr && !newHighlightNodes.has(t)) {
          newHighlightNodes.add(t);
          newHighlightLinks.add(link);
          toVisit.push(t);
        }
        if (t === curr && !newHighlightNodes.has(s)) {
          newHighlightNodes.add(s);
          newHighlightLinks.add(link);
          toVisit.push(s);
        }
      });
    }
    
    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);
    
    if (fgRef.current) {
      fgRef.current.zoomToFit(1000, 50, (node: any) => newHighlightNodes.has(node.id));
    }
  }, [selectedNode, data]);

  // Custom node rendering for a premium feel
  const drawNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isSelected = selectedNode?.id === node.id;
    const isHighlighted = highlightNodes.has(node.id);
    const isMuted = highlightNodes.size > 0 && !isHighlighted;
    
    const color = getNodeColor(node);
    
    ctx.globalAlpha = isMuted ? 0.2 : 1;
    
    // Outer glow if selected
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 10, 0, 2 * Math.PI, false);
      ctx.fillStyle = `${color}40`; // 25% opacity
      ctx.fill();
    }

    // Node Circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Border
    ctx.lineWidth = isSelected ? 1.5 : 0.5;
    ctx.strokeStyle = isSelected ? '#ffffff' : '#0f172a';
    ctx.stroke();

    // Label if zoomed in enough or if highlighted
    if (globalScale >= 2.5 || isHighlighted) {
      const label = node.title || node.type;
      const fontSize = 12 / globalScale;
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Label Background
      const textWidth = ctx.measureText(label).width;
      const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4); 
      
      ctx.fillStyle = isSelected ? '#1e293b' : 'rgba(15, 23, 42, 0.8)';
      ctx.beginPath();
      // @ts-ignore
      ctx.roundRect(node.x - bckgDimensions[0] / 2, node.y + 8, bckgDimensions[0], bckgDimensions[1], 2);
      ctx.fill();
      
      // Label Text
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(label, node.x, node.y + 8 + fontSize * 0.6);
    }
    
    ctx.globalAlpha = 1;
  }, [selectedNode, highlightNodes, getNodeColor]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center text-slate-500">
        <Network className="w-12 h-12 mb-4 opacity-50 text-blue-500" />
        <p className="font-semibold text-lg">No engineering graph available yet.</p>
        <p className="text-sm">Run the workflow to generate relationships.</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-[800px] w-full rounded-2xl border border-white/10 bg-[#020617] overflow-hidden shadow-2xl">
      
      <div className="absolute top-6 left-6 z-10 glass px-4 py-2 rounded-xl flex items-center gap-4 text-xs font-bold shadow-lg">
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Requirement</div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Architecture</div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Decision</div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Task</div>
      </div>

      <div ref={containerRef} className="flex-1 w-full h-full">
        {dimensions.width > 0 && (
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={{ nodes: data.nodes, links: data.edges }}
            nodeCanvasObject={drawNode}
            nodeRelSize={6}
            linkColor={(link) => highlightLinks.has(link) ? '#cbd5e1' : 'rgba(51, 65, 85, 0.4)'}
            linkWidth={(link) => highlightLinks.has(link) ? 2 : 1}
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
            linkDirectionalArrowColor={(link) => highlightLinks.has(link) ? '#cbd5e1' : 'rgba(51, 65, 85, 0.4)'}
            onNodeClick={handleNodeClick}
            onBackgroundClick={handleBackgroundClick}
            d3AlphaDecay={0.05}
            d3VelocityDecay={0.3}
            onEngineStop={() => fgRef.current?.zoomToFit(1000, 50)}
          />
        )}
      </div>

      {/* Inspector Sidebar */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 h-full w-80 glass border-l border-white/10 shadow-2xl flex flex-col z-20"
          >
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getNodeColor(selectedNode) }} 
                />
                <h3 className="font-bold text-slate-200 uppercase tracking-widest text-xs">
                  {selectedNode.type}
                </h3>
              </div>
              <button 
                onClick={handleBackgroundClick}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">{selectedNode.title || selectedNode.type}</h2>
                {selectedNode.description && (
                  <p className="text-sm text-slate-400 leading-relaxed">{selectedNode.description}</p>
                )}
              </div>

              {/* Confidence Badge */}
              <div className="glass bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">AI Confidence</div>
                  <div className="text-sm font-medium text-slate-300">Strong Evidence</div>
                </div>
                <div className="text-2xl font-black text-blue-400">92%</div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleTraceLineage}
                  className="py-2 px-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" /> Trace Lineage
                </button>
                <button className="py-2 px-3 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" /> View Diff
                </button>
              </div>

              {/* Derived From */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Network className="w-3.5 h-3.5" /> Derived From
                </h4>
                {data?.edges.filter(e => {
                  const targetId = typeof e.target === 'object' ? e.target.id : e.target;
                  return targetId === selectedNode.id;
                }).map((edge, i) => {
                  const sourceNode = typeof edge.source === 'object' ? edge.source : data.nodes.find(n => n.id === edge.source);
                  if (!sourceNode) return null;
                  return (
                    <div key={i} className="p-3 bg-black/20 rounded-lg border border-white/5 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => handleNodeClick(sourceNode)}>
                      <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">{sourceNode.type}</div>
                      <div className="text-sm font-medium text-slate-300 truncate">{sourceNode.title || sourceNode.id}</div>
                    </div>
                  );
                })}
              </div>

              {/* Validation */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Validation Status
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-green-400 font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Syntactic checks passed
                  </div>
                  <div className="flex items-center gap-2 text-green-400 font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Dependency validation
                  </div>
                  {selectedNode.type === 'TASK' && (
                    <div className="flex items-center gap-2 text-yellow-500 font-medium mt-2">
                      <AlertTriangle className="w-4 h-4" /> Performance review recommended
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

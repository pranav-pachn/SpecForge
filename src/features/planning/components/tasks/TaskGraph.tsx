"use client";

import { useState, useEffect } from "react";
import { ReactFlow, Controls, Background, MiniMap, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TaskDetails } from "./TaskDetails";
import { Network, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export function TaskGraph({ planArtifact, workflowId }: { planArtifact: any, workflowId: string }) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?workflowId=${workflowId}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [workflowId]);

  const handleGenerate = async () => {
    if (!planArtifact || !planArtifact.versions?.[0]) {
      toast.error("Plan artifact not found");
      return;
    }
    
    setGenerating(true);
    try {
      const res = await fetch(`/api/ai/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId,
          planContent: planArtifact.versions[0].content,
          planVersionId: planArtifact.versions[0].id
        })
      });
      
      if (!res.ok) throw new Error("Failed to generate tasks");
      
      toast.success("Tasks generated successfully");
      await fetchTasks();
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate tasks");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#0f111a] rounded-2xl border border-slate-200 dark:border-white/10 p-12 flex justify-center shadow-sm mt-8">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0f111a] rounded-2xl border border-slate-200 dark:border-white/10 p-12 flex flex-col items-center justify-center shadow-sm text-center mt-8 h-[600px]">
        <Network className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Tasks Generated</h3>
        <p className="text-slate-500 mb-6 max-w-md">Decompose the implementation plan into an actionable, dependency-aware task graph.</p>
        <button 
          onClick={handleGenerate}
          disabled={generating}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Generate Tasks
        </button>
      </div>
    );
  }

  // Create nodes and edges for ReactFlow
  const nodes: Node[] = tasks.map((t, idx) => {
    const isDone = t.status === "DONE" || t.status === "COMPLETED";
    const isActive = t.status === "TODO" || t.status === "IN_PROGRESS";
    
    let bgColor = '#1e293b';
    let color = '#94a3b8';
    let border = '1px solid #334155';
    
    if (isDone) {
      bgColor = '#10b981';
      color = 'white';
      border = 'none';
    } else if (isActive) {
      bgColor = '#3b82f6';
      color = 'white';
      border = 'none';
    }

    // extremely simple auto layout logic
    const x = (idx % 3) * 250 + 100;
    const y = Math.floor(idx / 3) * 150 + 50;

    return {
      id: t.id,
      position: { x, y },
      data: { label: `${t.title}\n${isDone ? '✓ Complete' : isActive ? '● Ready' : 'Pending'}` },
      style: { backgroundColor: bgColor, color, border, borderRadius: '8px', padding: '10px', fontWeight: 'bold' }
    };
  });

  const edges: Edge[] = [];
  tasks.forEach(t => {
    t.dependencies?.forEach((dep: any) => {
      edges.push({
        id: `e-${dep.dependsOnId}-${t.id}`,
        source: dep.dependsOnId,
        target: t.id,
        type: 'smoothstep',
        animated: t.status === "IN_PROGRESS" || t.status === "TODO",
        style: { stroke: t.status === "TODO" || t.status === "IN_PROGRESS" ? '#3b82f6' : '#94a3b8' }
      });
    });
  });

  return (
    <div className="bg-white dark:bg-[#0f111a] rounded-2xl border border-slate-200 dark:border-white/10 p-8 shadow-sm mt-8 h-[600px] flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <Network className="w-5 h-5 text-blue-500" /> Task Graph
          </h3>
          <p className="text-sm text-slate-500 mt-1">Dependency-aware engineering plan.</p>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Regenerate Tasks
        </button>
      </div>
      
      <div className="flex-1 flex gap-6 overflow-hidden">
        <div className="flex-1 bg-slate-50 dark:bg-[#05050a] rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden">
          <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            fitView
            onNodeClick={(_, node) => setSelectedTaskId(node.id)}
            className="dark:bg-[#05050a]"
          >
            <Background color="#334155" gap={20} />
            <Controls className="dark:bg-slate-800 dark:border-slate-700" />
            <MiniMap className="dark:bg-slate-900" maskColor="rgba(0,0,0,0.5)" />
          </ReactFlow>
        </div>
        
        {selectedTaskId && (
          <div className="w-96 shrink-0 h-full overflow-y-auto">
            <TaskDetails task={tasks.find(t => t.id === selectedTaskId)} onClose={() => setSelectedTaskId(null)} />
          </div>
        )}
      </div>
    </div>
  );
}

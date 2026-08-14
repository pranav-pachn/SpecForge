import React from "react";
import { ReactFlow, Background, Controls, Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const initialNodes: Node[] = [
  {
    id: "spec",
    position: { x: 400, y: 50 },
    data: { label: "Spec v4" },
    style: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', fontSize: '12px', fontWeight: 'bold' }
  },
  {
    id: "req",
    position: { x: 400, y: 150 },
    data: { label: "REQ-03" },
    style: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', fontSize: '12px', fontWeight: 'bold' }
  },
  {
    id: "arch",
    position: { x: 250, y: 250 },
    data: { label: "⚠ AuthService" },
    style: { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '8px', padding: '10px', fontSize: '12px', fontWeight: 'bold' }
  },
  {
    id: "dec",
    position: { x: 550, y: 250 },
    data: { label: "⚠ DEC-07" },
    style: { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '8px', padding: '10px', fontSize: '12px', fontWeight: 'bold' }
  },
  {
    id: "task1",
    position: { x: 250, y: 350 },
    data: { label: "⚠ TASK-04" },
    style: { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '8px', padding: '10px', fontSize: '12px', fontWeight: 'bold' }
  },
  {
    id: "task2",
    position: { x: 550, y: 350 },
    data: { label: "⚠ TASK-07" },
    style: { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '8px', padding: '10px', fontSize: '12px', fontWeight: 'bold' }
  },
  {
    id: "exec",
    position: { x: 250, y: 450 },
    data: { label: "⚠ Execution Pack #4" },
    style: { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '8px', padding: '10px', fontSize: '12px', fontWeight: 'bold' }
  },
  // Unaffected nodes
  {
    id: "unaffected-arch",
    position: { x: 100, y: 250 },
    data: { label: "✓ DatabaseService" },
    style: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '8px', padding: '10px', fontSize: '12px', fontWeight: 'bold', opacity: 0.7 }
  },
  {
    id: "unaffected-task",
    position: { x: 100, y: 350 },
    data: { label: "✓ TASK-01" },
    style: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '8px', padding: '10px', fontSize: '12px', fontWeight: 'bold', opacity: 0.7 }
  }
];

const initialEdges: Edge[] = [
  { id: "e1", source: "spec", target: "req", animated: true },
  { id: "e2", source: "req", target: "arch", animated: true, style: { stroke: '#ef4444' } },
  { id: "e3", source: "req", target: "dec", animated: true, style: { stroke: '#ef4444' } },
  { id: "e4", source: "arch", target: "task1", animated: true, style: { stroke: '#ef4444' } },
  { id: "e5", source: "dec", target: "task2", animated: true, style: { stroke: '#ef4444' } },
  { id: "e6", source: "task1", target: "exec", animated: true, style: { stroke: '#ef4444' } },
  { id: "e7", source: "req", target: "unaffected-arch", style: { stroke: '#22c55e', opacity: 0.3 } },
  { id: "e8", source: "unaffected-arch", target: "unaffected-task", style: { stroke: '#22c55e', opacity: 0.3 } }
];

export function DriftImpactGraph() {
  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#94a3b8" gap={16} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

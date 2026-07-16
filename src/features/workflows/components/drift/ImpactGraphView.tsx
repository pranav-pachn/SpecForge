import { FileText, CheckSquare, Settings2, GitBranch } from "lucide-react";
import type { ImpactGraph, ImpactNode } from "@/server/services/drift-engine";

interface ImpactGraphViewProps {
  graph: ImpactGraph;
  selectedNodes: string[];
  onToggleNode: (nodeId: string) => void;
}

export default function ImpactGraphView({ graph, selectedNodes, onToggleNode }: ImpactGraphViewProps) {
  if (!graph || graph.roots.length === 0) {
    return null;
  }

  return (
    <div className="px-8 mt-12 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-purple-600" />
          Traceability Impact Graph
        </h3>
        <div className="text-sm text-slate-500">
          Showing dependencies marked <span className="font-mono text-xs bg-yellow-100 text-yellow-800 px-1 rounded dark:bg-yellow-900/50 dark:text-yellow-300">STALE</span>
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden animate-in" style={{ animationDelay: '200ms' }}>
        <div className="p-6">
          <div className="space-y-2">
            {graph.roots.map((root, i) => (
              <GraphNode 
                key={root.id} 
                node={root} 
                level={0} 
                isLast={i === graph.roots.length - 1} 
                selectedNodes={selectedNodes}
                onToggleNode={onToggleNode}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GraphNode({ 
  node, 
  level, 
  isLast,
  selectedNodes,
  onToggleNode
}: { 
  node: ImpactNode, 
  level: number, 
  isLast: boolean,
  selectedNodes: string[],
  onToggleNode: (id: string) => void
}) {
  const getIcon = () => {
    switch (node.type) {
      case "requirement": return <FileText className="w-4 h-4 text-blue-500" />;
      case "plan_section": return <FileText className="w-4 h-4 text-purple-500" />;
      case "task": return <CheckSquare className="w-4 h-4 text-indigo-500" />;
      case "execution_pack": return <Settings2 className="w-4 h-4 text-emerald-500" />;
    }
  };

  const isSelected = selectedNodes.includes(node.id);

  // Requirements themselves aren't regenerated, only downstream tasks/packs
  const canSelect = node.type !== "requirement";

  return (
    <div className="relative">
      {level > 0 && (
        <div 
          className="absolute border-l-2 border-b-2 border-white/10 rounded-bl-lg"
          style={{ 
            left: `${(level - 1) * 32 + 15}px`, 
            top: '-16px', 
            width: '16px', 
            height: '36px' 
          }}
        />
      )}
      
      <div 
        className="flex items-center gap-3 py-2 relative z-10 transition-transform duration-300 hover:translate-x-1"
        style={{ paddingLeft: `${level * 32}px` }}
      >
        <div className="flex items-center gap-3 glass border-white/5 px-2.5 py-1.5 rounded-lg group shadow-sm hover:shadow-md hover:bg-white/10 transition-colors">
          {canSelect ? (
            <input 
              type="checkbox" 
              checked={isSelected}
              onChange={() => onToggleNode(node.id)}
              className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-600 cursor-pointer"
            />
          ) : (
            <div className="w-4 h-4" /> // placeholder
          )}
          
          <div className="p-1.5 rounded-md glass border-white/10 text-slate-400 group-hover:text-white transition-colors shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]">
            {getIcon()}
          </div>
          
          <span className="font-medium text-sm text-slate-200 group-hover:text-white transition-colors">
            {node.title.length > 60 ? node.title.substring(0, 60) + '...' : node.title}
          </span>
          
          <span className="uppercase text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
            {node.status}
          </span>
        </div>
      </div>
      
      {node.children && node.children.length > 0 && (
        <div className="relative">
          {!isLast && level > 0 && (
            <div 
              className="absolute border-l-2 border-white/10 h-full"
              style={{ left: `${(level - 1) * 32 + 15}px`, top: '-16px' }}
            />
          )}
          {node.children.map((child, i) => (
            <GraphNode 
              key={child.id} 
              node={child} 
              level={level + 1} 
              isLast={i === node.children.length - 1} 
              selectedNodes={selectedNodes}
              onToggleNode={onToggleNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

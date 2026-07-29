"use client";

import { useEffect, useState } from "react";
import { Loader2, GitBranch, Layers, Server, Database, Code, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ArchitectureTabProps {
  workflowId: string;
  onMutate: () => void;
}

export default function ArchitectureTab({ workflowId, onMutate }: ArchitectureTabProps) {
  const [loading, setLoading] = useState(true);
  const [architecture, setArchitecture] = useState<any>(null);

  useEffect(() => {
    const fetchArch = async () => {
      try {
        const res = await fetch(`/api/artifacts?workflowId=${workflowId}`);
        const artifacts = await res.json();
        const archArtifact = artifacts.find((a: any) => a.type === "ARCHITECTURE");
        
        if (archArtifact?.versions?.[0]) {
          const content = archArtifact.versions[0].content;
          setArchitecture(JSON.parse(content));
        }
      } catch (err) {
        console.error("Failed to load architecture artifact");
      } finally {
        setLoading(false);
      }
    };
    
    fetchArch();
  }, [workflowId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Loading architecture...</p>
      </div>
    );
  }

  if (!architecture) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
        <GitBranch className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No Architecture Available</h3>
        <p className="text-slate-500 max-w-md text-center mb-6">
          The system architecture has not been generated for this workflow yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Mermaid Diagram */}
      {architecture.architectureDiagram && (
        <div className="glass-panel p-6 rounded-xl">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-900 dark:text-white">
            <GitBranch className="w-5 h-5 text-indigo-500" />
            System Architecture
          </h2>
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 overflow-auto border border-slate-200 dark:border-slate-800">
             <pre className="text-xs text-slate-600 dark:text-slate-400 font-mono">
               {architecture.architectureDiagram}
             </pre>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Modules & Services */}
        <div className="glass-panel p-6 rounded-xl space-y-6">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-900 dark:text-white">
              <Layers className="w-5 h-5 text-blue-500" />
              Core Modules
            </h2>
            <ul className="space-y-3">
              {architecture.modules?.map((m: any, i: number) => (
                <li key={i} className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="font-medium text-slate-900 dark:text-white text-sm">{m.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{m.responsibility}</div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-900 dark:text-white">
              <Server className="w-5 h-5 text-emerald-500" />
              Services
            </h2>
            <ul className="space-y-3">
              {architecture.services?.map((s: any, i: number) => (
                <li key={i} className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white text-sm">{s.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{s.type}</div>
                  </div>
                  <span className="text-xs font-mono px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400">
                    {s.tech}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Database & Entities */}
        <div className="glass-panel p-6 rounded-xl space-y-6">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-900 dark:text-white">
              <Database className="w-5 h-5 text-orange-500" />
              Data Entities
            </h2>
            <ul className="space-y-3">
              {architecture.entities?.map((e: any, i: number) => (
                <li key={i} className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="font-medium text-slate-900 dark:text-white text-sm mb-2">{e.name}</div>
                  <div className="flex flex-wrap gap-1">
                    {e.fields?.map((f: string, j: number) => (
                      <span key={j} className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400">
                        {f}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-900 dark:text-white">
              <Code className="w-5 h-5 text-purple-500" />
              API Contracts
            </h2>
            <ul className="space-y-3">
              {architecture.apis?.map((api: any, i: number) => (
                <li key={i} className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                    api.method === 'GET' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    api.method === 'POST' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    api.method === 'PUT' || api.method === 'PATCH' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {api.method}
                  </span>
                  <div>
                    <div className="font-mono text-xs text-slate-900 dark:text-white mb-1">{api.path}</div>
                    <div className="text-xs text-slate-500">Res: {api.response}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

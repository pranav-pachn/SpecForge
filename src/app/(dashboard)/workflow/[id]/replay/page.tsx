"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Play, Pause, ChevronRight, Activity, Zap, Database, GitMerge, FileText, CheckCircle, BrainCircuit } from "lucide-react";

export default function WorkflowReplayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const executionId = searchParams.get('executionId');
  const workflowId = params.id as string;

  const [trace, setTrace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Replay State
  const [progress, setProgress] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);

  useEffect(() => {
    if (!executionId) return;
    
    // In a real app, this would fetch from /api/admin/traces?query=executionId
    // and then call TraceAssembler. But we simulate receiving the AssembledTrace.
    fetch(`/api/admin/traces?query=${executionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.traces && data.traces.length > 0) {
          // Flatten spans for rendering
          setTrace(data.traces[0]);
        }
      })
      .finally(() => setLoading(false));
  }, [executionId]);

  // Scrubbing logic
  const handleScrub = (val: number) => {
    setProgress(val);
    setIsPlaying(false);
  };

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return p + 1; // Playback speed
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const getIconForType = (type: string) => {
    if (type === 'GATEWAY' || type === 'PROVIDER') return <Zap className="w-4 h-4 text-amber-400" />;
    if (type === 'CONTEXT' || type === 'RAG') return <Database className="w-4 h-4 text-blue-400" />;
    if (type === 'AGENT') return <BrainCircuit className="w-4 h-4 text-purple-400" />;
    if (type === 'EVALUATION') return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (type === 'MEMORY' || type === 'DECISION') return <GitMerge className="w-4 h-4 text-pink-400" />;
    return <Activity className="w-4 h-4 text-slate-400" />;
  };

  if (loading) return <div className="p-12 text-slate-400 animate-pulse">Loading execution trace...</div>;
  if (!trace) return <div className="p-12 text-slate-500">Trace not found.</div>;

  // Filter spans based on time scrubbing
  // Assumes trace.spans is ordered by startedAt
  const startTime = new Date(trace.startedAt).getTime();
  const totalDuration = trace.endedAt ? new Date(trace.endedAt).getTime() - startTime : 10000; // fallback 10s
  
  const currentScrubTime = startTime + (totalDuration * (progress / 100));

  const visibleSpans = trace.spans?.filter((s: any) => new Date(s.startedAt).getTime() <= currentScrubTime) || [];
  
  const selectedSpan = trace.spans?.find((s: any) => s.id === selectedSpanId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto flex h-[80vh]">
      
      {/* Left Column: Timeline & Scrubbing */}
      <div className="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-200">Execution Replay</h2>
            <div className="text-xs text-slate-500 font-mono mt-1">Exec: {executionId}</div>
          </div>
          
          <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-lg border border-slate-700/50">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-slate-300 hover:text-white transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <input 
              type="range" 
              min="0" max="100" 
              value={progress} 
              onChange={e => handleScrub(Number(e.target.value))}
              className="w-48 accent-purple-500"
            />
            <span className="text-xs font-mono text-slate-400 w-8">{Math.round(progress)}%</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 relative">
          <div className="absolute top-0 bottom-0 left-[35px] w-px bg-slate-800" />
          
          <div className="space-y-4">
            {visibleSpans.map((span: any) => (
              <div 
                key={span.id} 
                onClick={() => setSelectedSpanId(span.id)}
                className={`relative pl-12 cursor-pointer group ${selectedSpanId === span.id ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
              >
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border flex items-center justify-center z-10 transition-colors ${
                  selectedSpanId === span.id ? 'bg-purple-900 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-slate-900 border-slate-700 group-hover:border-slate-500'
                }`}>
                  {getIconForType(span.kind)}
                </div>
                
                <div className={`p-3 rounded-xl border transition-all ${
                  selectedSpanId === span.id ? 'bg-purple-900/20 border-purple-500/50' : 'bg-slate-900/50 border-slate-800'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-200 block">{span.name}</span>
                      <span className="text-xs text-slate-500 font-mono mt-0.5 block">{span.kind}</span>
                    </div>
                    {span.durationMs && (
                      <span className="text-xs font-mono bg-black/30 px-2 py-1 rounded text-slate-400">
                        {span.durationMs}ms
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Deep Inspection Sidebar */}
      <div className="w-[450px] ml-6 flex flex-col gap-6">
        {selectedSpan ? (
          <>
            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <h3 className="font-bold text-slate-200 mb-1 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                Span Details
              </h3>
              <div className="text-xs font-mono text-slate-500 break-all mb-4">
                ID: {selectedSpan.id}
              </div>
              
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-slate-500">Status</span>
                  <span className={selectedSpan.status === 'COMPLETED' ? 'text-green-400' : 'text-amber-400'}>{selectedSpan.status}</span>
                </div>
                {selectedSpan.correlationId && (
                  <div className="flex justify-between border-b border-slate-800/50 pb-2">
                    <span className="text-slate-500">Correlation</span>
                    <span className="font-mono">{selectedSpan.correlationId.substring(0,8)}...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Snapshots */}
            {selectedSpan.snapshots?.length > 0 ? (
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {selectedSpan.snapshots.map((snap: any) => (
                  <div key={snap.id} className="glass-panel rounded-xl overflow-hidden border border-slate-700/50">
                    <div className="bg-slate-800/50 px-4 py-2 font-bold text-xs tracking-wider uppercase text-slate-300 border-b border-slate-700/50">
                      {snap.type} Snapshot
                    </div>
                    <div className="p-4 bg-black/20 text-xs font-mono text-slate-400 overflow-x-auto">
                      <pre>{JSON.stringify(snap.payload, null, 2)}</pre>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-2xl">
                <Database className="w-8 h-8 text-slate-700 mb-2" />
                <p className="text-slate-500 text-sm">No rich snapshots recorded for this span.</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-2xl">
            <Activity className="w-10 h-10 text-slate-700 mb-4" />
            <h3 className="text-slate-300 font-medium mb-1">Inspector Empty</h3>
            <p className="text-slate-500 text-sm">Select a span from the replay timeline to inspect its prompt, context, or decision snapshots.</p>
          </div>
        )}
      </div>

    </div>
  );
}

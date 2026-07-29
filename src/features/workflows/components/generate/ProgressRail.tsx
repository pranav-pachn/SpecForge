"use client";

import { useEffect, useState, useRef } from "react";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";

interface ProgressRailProps {
  workflowId: string;
  intakeData: any;
  onComplete: () => void;
  onError: (msg: string) => void;
}

export default function ProgressRail({ workflowId, intakeData, onComplete, onError }: ProgressRailProps) {
  const [stages, setStages] = useState<Record<string, 'pending' | 'running' | 'done' | 'failed'>>({
    'Pipeline': 'pending',
    'Planning': 'pending',
    'Clarifying': 'pending',
    'Specification': 'pending',
    'Architecture': 'pending',
    'Task Planning': 'pending',
    'Engineering Review': 'pending',
    'Validation': 'pending',
  });
  
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(Date.now());
  const hasStartedRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    let isSubscribed = true;

    const runPipeline = async () => {
      try {
        const response = await fetch(`/api/workflows/${workflowId}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(intakeData),
        });

        if (!response.ok) {
          throw new Error("Failed to start pipeline");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error("No reader available");

        let buffer = "";

        while (isSubscribed) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith('event:')) {
              const eventLines = line.split('\n');
              const eventType = eventLines[0].replace('event: ', '').trim();
              const eventDataRaw = eventLines[1]?.replace('data: ', '').trim();
              
              if (!eventDataRaw) continue;
              
              const data = JSON.parse(eventDataRaw);

              if (eventType === 'progress') {
                setStages(prev => ({ ...prev, [data.stage]: data.status }));
              } else if (eventType === 'complete') {
                onComplete();
                isSubscribed = false;
              } else if (eventType === 'error') {
                onError(data.message);
                isSubscribed = false;
              }
            }
          }
        }
      } catch (err: any) {
        if (isSubscribed) onError(err.message);
      }
    };

    runPipeline();

    return () => { isSubscribed = false; };
  }, [workflowId, intakeData, onComplete, onError]);

  const orderedStages = [
    'Planning',
    'Clarifying',
    'Specification',
    'Architecture',
    'Task Planning',
    'Engineering Review',
    'Validation'
  ];

  const getIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running': return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default: return <Circle className="w-5 h-5 text-slate-400/50" />;
    }
  };

  const completedCount = Object.entries(stages).filter(([k, v]) => v === 'done' && k !== 'Pipeline').length;

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900/50 border border-slate-700 p-6 rounded-xl">
      <h3 className="text-lg font-bold text-white mb-6">Orchestrating Workflow</h3>
      <div className="space-y-4">
        {orderedStages.map(stage => (
          <div key={stage} className="flex items-center gap-4">
            {getIcon(stages[stage])}
            <span className={`text-sm font-medium ${stages[stage] === 'running' ? 'text-white' : 'text-slate-400'}`}>
              {stage}
            </span>
            {stages[stage] === 'running' && (
              <span className="ml-auto text-xs text-blue-400 animate-pulse">Running...</span>
            )}
            {stages[stage] === 'done' && (
              <span className="ml-auto text-xs text-green-400">Done</span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-8 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
        <span>{completedCount} / {orderedStages.length} stages complete</span>
        <span>~{elapsed}s elapsed</span>
      </div>
    </div>
  );
}

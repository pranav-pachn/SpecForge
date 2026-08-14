"use client";

import { useState } from "react";
import { Play, Database, Workflow, Bot, MessagesSquare } from "lucide-react";
import { toast } from "sonner";

export default function PlaygroundsPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleTest = async (testLayer: string, payload: any) => {
    setLoading(testLayer);
    try {
      const res = await fetch("/api/admin/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testLayer, payload })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(`Test for ${testLayer} completed successfully`);
        console.log(`[Playground Result - ${testLayer}]`, data);
      } else {
        toast.error(`Test failed: ${data.error}`);
      }
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-xl font-bold text-slate-200">Active Test Playgrounds</h2>
      <p className="text-slate-400 text-sm">
        These playgrounds trigger active synthetic tests inside the platform. Check browser console for full output traces.
      </p>

      <div className="grid gap-6">
        
        {/* Events */}
        <div className="glass-panel p-6 rounded-2xl flex items-start gap-4">
          <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
            <Workflow className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-200 mb-2">PlatformEventBus Test</h3>
            <p className="text-sm text-slate-400 mb-4">
              Emits a synthetic <code>SpecificationCreated</code> event to the bus. Should trigger the DecisionSubscriber and appear in the Event Timeline.
            </p>
            <button 
              onClick={() => handleTest("EVENTS", {})}
              disabled={loading !== null}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              {loading === "EVENTS" ? <span className="animate-pulse">Running...</span> : <><Play className="w-4 h-4" /> Run Event Test</>}
            </button>
          </div>
        </div>

        {/* Gateway */}
        <div className="glass-panel p-6 rounded-2xl flex items-start gap-4">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
            <Bot className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-200 mb-2">AI Gateway Routing Simulator</h3>
            <p className="text-sm text-slate-400 mb-4">
              Simulates a capability request to see which provider the router selects.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => handleTest("GATEWAY", { capability: "SPECIFICATION" })}
                disabled={loading !== null}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                {loading === "GATEWAY" ? <span className="animate-pulse">Routing...</span> : <><Play className="w-4 h-4" /> Route SPECIFICATION</>}
              </button>
              <button 
                onClick={() => handleTest("GATEWAY", { capability: "REVIEW" })}
                disabled={loading !== null}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                {loading === "GATEWAY" ? <span className="animate-pulse">Routing...</span> : <><Play className="w-4 h-4" /> Route REVIEW</>}
              </button>
            </div>
          </div>
        </div>

        {/* Context */}
        <div className="glass-panel p-6 rounded-2xl flex items-start gap-4">
          <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-200 mb-2">Context Layer Test</h3>
            <p className="text-sm text-slate-400 mb-4">
              Executes a full context assembly for a synthetic query.
            </p>
            <button 
              onClick={() => handleTest("CONTEXT", { prompt: "Why Redis?" })}
              disabled={loading !== null}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              {loading === "CONTEXT" ? <span className="animate-pulse">Retrieving...</span> : <><Play className="w-4 h-4" /> Search "Why Redis?"</>}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

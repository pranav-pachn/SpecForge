"use client";

import { useEffect, useState } from "react";
import { Loader2, Terminal, ArrowRight, ServerCrash, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ToolName } from "@prisma/client";
import ExecutionPackCard from "@/features/workflows/components/workflows/ExecutionPackCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { toast } from "sonner";

export default function ExecuteTab({ workflowId, onMutate, onNext }: { workflowId: string, onMutate?: () => void, onNext?: () => void }) {
  const router = useRouter();
  const [workflow, setWorkflow] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [packs, setPacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolName>("CURSOR");

  useEffect(() => {
    fetchData();
  }, [workflowId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const wfRes = await fetch(`/api/workflows/${workflowId}`);
      const wfData = await wfRes.json();
      setWorkflow(wfData);

      const tasksRes = await fetch(`/api/tasks?workflowId=${workflowId}`);
      const tasksData = await tasksRes.json();
      setTasks(tasksData);

      // We should ideally fetch packs from a dedicated endpoint or embed them in tasks.
      // For MVP, if tasks don't include packs, we can extract them if they are in the workflow data,
      // or we can just fetch the workflow again if it includes them.
      // Assuming tasks might not include packs in our current GET /tasks route, 
      // let's just use a hack: fetch packs through another route or add it to tasks route.
      // For now, let's assume we can fetch all packs for this workflow if we had a route.
      // Wait, in schema, executionPacks is on Task. Let's rely on the tasks response if we update the route to include them.
      // Let's assume we updated /api/tasks to include executionPacks.
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const specContent = workflow?.artifacts?.find((a: any) => a.type === "SPEC")?.versions?.[0]?.content;
  const planContent = workflow?.artifacts?.find((a: any) => a.type === "PLAN")?.versions?.[0]?.content;

  const handleGenerate = async (taskId: string) => {
    setGeneratingId(taskId);
    try {
      const generatePromise = fetch("/api/ai/execution-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          toolName: selectedTool,
          specContent,
          planContent,
        }),
      });

      toast.promise(generatePromise, {
        loading: "Generating execution pack...",
        success: "Execution pack generated!",
        error: "Failed to generate execution pack"
      });

      await generatePromise;
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleGenerateAll = async () => {
    setGeneratingAll(true);
    try {
      const batchPromise = fetch("/api/ai/execution-pack/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId,
          toolName: selectedTool,
          specContent,
          planContent,
        }),
      });

      toast.promise(batchPromise, {
        loading: "Generating all execution packs...",
        success: "All packs generated!",
        error: "Failed to generate all packs"
      });

      await batchPromise;
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingAll(false);
    }
  };

  const handleContinue = async () => {
    try {
      await fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ENGINEERING_REVIEW" }),
      });
      router.refresh();
      onMutate?.();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<ServerCrash className="w-8 h-8" />}
        title="No Tasks Available"
        description="You must break down tasks before generating execution packs."
      />
    );
  }

  return (
    <div className="glass border-white/10 border rounded-xl shadow-sm overflow-hidden">
      <div className="bg-white/5 border-b px-6 py-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Terminal className="w-6 h-6 text-blue-500" />
            Execution Packs
          </h2>
          <p className="text-sm text-slate-500 mt-1">Generate AI-optimized prompts for your chosen tool.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-md overflow-hidden glass border-white/10">
            <button
              onClick={() => setSelectedTool("CURSOR")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${selectedTool === "CURSOR" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50" : "text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
            >
              Cursor
            </button>
            <button
              onClick={() => setSelectedTool("CLAUDE_CODE")}
              className={`px-3 py-1.5 text-sm font-medium border-l transition-colors ${selectedTool === "CLAUDE_CODE" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50" : "text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
            >
              Claude Code
            </button>
            <button
              onClick={() => setSelectedTool("WINDSURF")}
              className={`px-3 py-1.5 text-sm font-medium border-l transition-colors ${selectedTool === "WINDSURF" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50" : "text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
            >
              Windsurf
            </button>
          </div>
          <button
            onClick={handleGenerateAll}
            disabled={generatingAll}
            className="px-4 py-2 text-sm font-medium text-slate-600 glass border-white/20 rounded-md hover:bg-white/10 text-white flex items-center gap-2"
          >
            {generatingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate All"}
          </button>
        </div>
      </div>

      <div className="p-6 bg-slate-50/50 dark:bg-slate-950/50 min-h-[400px]">
        <div className="space-y-6 max-w-4xl mx-auto">
          {tasks.map((task) => {
            // Because /api/tasks doesn't return executionPacks right now, let's just pretend we have them,
            // or assume we need to update /api/tasks to include them. (I will update /api/tasks in next step).
            const pack = task.executionPacks?.find((p: any) => p.toolName === selectedTool);
            
            return (
              <ExecutionPackCard 
                key={task.id}
                task={task}
                pack={pack}
                onGenerate={handleGenerate}
                isGenerating={generatingId === task.id}
              />
            );
          })}
        </div>
      </div>

      <div className="p-6 border-t border-white/10">
        <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-green-500/20 bg-green-500/5 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <h3 className="text-xl font-bold text-white">Execution Packs Ready</h3>
            </div>
            <p className="text-sm text-slate-400">Copy these packs to your IDE. When development is done, proceed to Engineering Review.</p>
          </div>
          <button
            onClick={() => {
              handleContinue();
              if (onNext) onNext();
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]"
          >
            Continue to Eng Review <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

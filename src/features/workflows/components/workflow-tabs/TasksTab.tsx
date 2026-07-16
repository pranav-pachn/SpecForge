"use client";

import { useEffect, useState } from "react";
import { Loader2, ListTodo, Plus, ArrowRight, Split } from "lucide-react";
import { useRouter } from "next/navigation";
import TaskCard from "@/features/workflows/components/workflows/TaskCard";

export default function TasksTab({ workflowId, onMutate }: { workflowId: string, onMutate?: () => void }) {
  const router = useRouter();
  const [workflow, setWorkflow] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [taskToSplitId, setTaskToSplitId] = useState<string | null>(null);
  const [splitCount, setSplitCount] = useState<number>(2);

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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const plan = workflow.artifacts?.find((a: any) => a.type === "PLAN");
      const planVersion = plan?.versions?.[0];

      if (!planVersion) return;

      await fetch("/api/ai/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId,
          planContent: planVersion.content,
          planVersionId: planVersion.id,
        }),
      });
      await fetchData();
      onMutate?.();
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const updateTask = async (id: string, data: any) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    } catch (e) {
      console.error(e);
      await fetchData(); // Revert on failure
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      console.error("Failed to delete task:", e);
    }
  };

  const handleSplit = (id: string) => {
    setTaskToSplitId(id);
    setIsSplitModalOpen(true);
  };

  const confirmSplit = async () => {
    if (!taskToSplitId) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/ai/tasks/split`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId,
          taskId: taskToSplitId,
          count: splitCount
        }),
      });
      if (res.ok) {
        await fetchData();
        setIsSplitModalOpen(false);
        setTaskToSplitId(null);
      }
    } catch (e) {
      console.error("Failed to split task via AI:", e);
    } finally {
      setGenerating(false);
    }
  };

  const handleAddManualTask = async () => {
    setGenerating(true);
    try {
      const plan = workflow?.artifacts?.find((a: any) => a.type === "PLAN");
      const planVersion = plan?.versions?.[0];
      if (!planVersion) return;

      await fetch(`/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId,
          versionId: planVersion.id,
          title: "New Task",
          description: "Description...",
          priority: 3,
          order: tasks.length > 0 ? Math.max(...tasks.map(t => t.order)) + 1 : 0,
        }),
      });
      await fetchData();
      onMutate?.();
    } catch (e) {
      console.error("Failed to add manual task:", e);
    } finally {
      setGenerating(false);
    }
  };

  const handleMove = async (id: string, direction: "up" | "down") => {
    const currentIndex = tasks.findIndex(t => t.id === id);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= tasks.length) return;
    
    const currentTask = tasks[currentIndex];
    const targetTask = tasks[targetIndex];
    
    // Optimistic swap
    const newTasks = [...tasks];
    newTasks[currentIndex] = { ...targetTask, order: currentTask.order };
    newTasks[targetIndex] = { ...currentTask, order: targetTask.order };
    setTasks(newTasks.sort((a, b) => a.order - b.order));
    
    try {
      // Swap order values in DB
      await Promise.all([
        fetch(`/api/tasks/${currentTask.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: targetTask.order }),
        }),
        fetch(`/api/tasks/${targetTask.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: currentTask.order }),
        })
      ]);
    } catch (e) {
      console.error("Failed to move task:", e);
      await fetchData();
    }
  };

  const handleContinue = async () => {
    try {
      await fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "EXECUTING" }),
      });
      router.refresh();
      onMutate?.();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  const plan = workflow?.artifacts?.find((a: any) => a.type === "PLAN");
  const planVersion = plan?.versions?.[0];

  if (!planVersion || planVersion.status !== "APPROVED") {
    return (
      <div className="glass border-white/10 border rounded-xl p-12 text-center shadow-sm">
        <ListTodo className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Plan Not Approved</h3>
        <p className="text-slate-500 mb-6">You must generate and approve the Implementation Plan before breaking down tasks.</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="glass border-white/10 border rounded-xl p-12 text-center shadow-sm">
        <ListTodo className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Task Breakdown</h3>
        <p className="text-slate-500 mb-6 max-w-lg mx-auto">
          Generate an actionable, sequential list of development tasks based on the approved implementation plan.
        </p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-md font-medium inline-flex items-center gap-2 transition-colors"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListTodo className="w-4 h-4" />}
          Generate Tasks
        </button>
      </div>
    );
  }

  const completedTasks = tasks.filter(t => t.status === "DONE").length;

  return (
    <div className="glass border-white/10 border rounded-xl shadow-sm overflow-hidden">
      <div className="bg-white/5 border-b px-6 py-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ListTodo className="w-6 h-6 text-blue-500" />
            Task Board
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-slate-500">
              {completedTasks} of {tasks.length} tasks completed
            </p>
            <div className="w-32 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all" 
                style={{ width: `${(completedTasks / tasks.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 text-sm font-medium text-slate-600 glass border-white/20 rounded-md hover:bg-white/10 text-white flex items-center gap-2"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Regenerate All"}
          </button>
          
          <button
            onClick={handleContinue}
            className="px-5 py-2 rounded-md font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm flex items-center gap-2"
          >
            Continue to Execute <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-6 bg-slate-50/50 dark:bg-slate-950/50 min-h-[400px]">
        <div className="space-y-4 max-w-4xl mx-auto">
          {tasks.map((task, index) => (
            <TaskCard 
              key={task.id}
              task={task}
              onUpdate={updateTask}
              onSplit={handleSplit}
              onMoveUp={(id) => handleMove(id, "up")}
              onMoveDown={(id) => handleMove(id, "down")}
              onDelete={handleDelete}
              isFirst={index === 0}
              isLast={index === tasks.length - 1}
            />
          ))}
          
          <button 
            onClick={handleAddManualTask}
            disabled={generating}
            className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 font-medium hover:border-slate-400 hover:text-slate-700 dark:hover:border-slate-600 transition-colors flex items-center justify-center gap-2 bg-transparent disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Add Manual Task
          </button>
        </div>
      </div>

      {isSplitModalOpen && taskToSplitId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="glass border-white/10 border rounded-2xl p-6 shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Split className="w-5 h-5 text-blue-500" />
              Split Task with AI
            </h3>
            <p className="text-slate-500 mb-6 text-sm">
              The AI will analyze the current task and break it down into smaller, actionable sub-tasks, replacing this one.
            </p>
            
            <div className="space-y-3 mb-8">
              <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <input 
                  type="radio" 
                  name="splitCount" 
                  checked={splitCount === 2} 
                  onChange={() => setSplitCount(2)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="font-medium">Split into 2 tasks</span>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <input 
                  type="radio" 
                  name="splitCount" 
                  checked={splitCount === 3} 
                  onChange={() => setSplitCount(3)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="font-medium">Split into 3 tasks</span>
              </label>
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsSplitModalOpen(false)}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                disabled={generating}
              >
                Cancel
              </button>
              <button 
                onClick={confirmSplit}
                disabled={generating}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50 transition-colors"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Split"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

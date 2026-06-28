"use client";

import { useEffect, useState } from "react";
import { Loader2, ListTodo, Plus, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import TaskCard from "@/components/workflows/TaskCard";

export default function TasksTab({ workflowId }: { workflowId: string }) {
  const router = useRouter();
  const [workflow, setWorkflow] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

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

  const handleSplit = async (id: string) => {
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return;
    
    const taskToSplit = tasks[taskIndex];
    
    try {
      // Create a new task right after this one
      const res = await fetch(`/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId,
          versionId: taskToSplit.versionId,
          title: `${taskToSplit.title} (Part 2)`,
          description: "Split from previous task. Please update.",
          priority: taskToSplit.priority,
          order: taskToSplit.order + 1,
        }),
      });
      
      if (res.ok) {
        // Increment order for all subsequent tasks
        const updates = tasks.slice(taskIndex + 1).map(t => 
          fetch(`/api/tasks/${t.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: t.order + 1 }),
          })
        );
        await Promise.all(updates);
        await fetchData();
      }
    } catch (e) {
      console.error("Failed to split task:", e);
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
      <div className="bg-white dark:bg-slate-950 border rounded-xl p-12 text-center shadow-sm">
        <ListTodo className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Plan Not Approved</h3>
        <p className="text-slate-500 mb-6">You must generate and approve the Implementation Plan before breaking down tasks.</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-950 border rounded-xl p-12 text-center shadow-sm">
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
    <div className="bg-white dark:bg-slate-950 border rounded-xl shadow-sm overflow-hidden">
      <div className="bg-slate-50 dark:bg-slate-900 border-b px-6 py-5 flex items-center justify-between">
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
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 flex items-center gap-2"
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
    </div>
  );
}

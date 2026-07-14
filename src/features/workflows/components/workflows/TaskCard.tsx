import { useState } from "react";
import { CheckCircle2, Circle, AlertCircle, PlayCircle, MoreVertical, ChevronDown, ChevronUp, SplitSquareVertical } from "lucide-react";
import { TaskStatus } from "@prisma/client";

interface TaskCardProps {
  task: any;
  onUpdate: (id: string, data: any) => Promise<void>;
  onSplit: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  TODO: <Circle className="w-5 h-5 text-slate-300" />,
  IN_PROGRESS: <PlayCircle className="w-5 h-5 text-blue-500" />,
  BLOCKED: <AlertCircle className="w-5 h-5 text-red-500" />,
  DONE: <CheckCircle2 className="w-5 h-5 text-green-500" />
};

export default function TaskCard({ task, onUpdate, onSplit, onMoveUp, onMoveDown, isFirst, isLast }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description || "",
    acceptanceCriteria: task.acceptanceCriteria || "",
    verificationNotes: task.verificationNotes || "",
  });

  const handleSave = async () => {
    await onUpdate(task.id, editData);
    setIsEditing(false);
  };

  const cycleStatus = async () => {
    const statuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"];
    const currentIndex = statuses.indexOf(task.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    await onUpdate(task.id, { status: nextStatus });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border rounded-xl shadow-sm overflow-hidden flex transition-shadow hover:shadow-md">
      {/* Reorder handles */}
      <div className="bg-slate-50 dark:bg-slate-950 border-r p-2 flex flex-col items-center justify-center gap-2 shrink-0">
        <button 
          onClick={() => onMoveUp(task.id)}
          disabled={isFirst}
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
        >
          <ChevronUp className="w-4 h-4 text-slate-500" />
        </button>
        <span className="text-xs font-bold text-slate-400">{task.order + 1}</span>
        <button 
          onClick={() => onMoveDown(task.id)}
          disabled={isLast}
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
        >
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      <div className="flex-1 p-5">
        {isEditing ? (
          <div className="space-y-4">
            <input 
              value={editData.title}
              onChange={e => setEditData({ ...editData, title: e.target.value })}
              className="w-full text-lg font-bold border-b focus:border-blue-500 outline-none pb-1 bg-transparent"
              placeholder="Task Title"
            />
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Description</label>
              <textarea 
                value={editData.description}
                onChange={e => setEditData({ ...editData, description: e.target.value })}
                className="w-full border rounded-md p-2 text-sm bg-slate-50 dark:bg-slate-950 min-h-[80px]"
                placeholder="What needs to be done?"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Acceptance Criteria</label>
                <textarea 
                  value={editData.acceptanceCriteria}
                  onChange={e => setEditData({ ...editData, acceptanceCriteria: e.target.value })}
                  className="w-full border rounded-md p-2 text-sm bg-slate-50 dark:bg-slate-950 min-h-[80px]"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Verification Notes</label>
                <textarea 
                  value={editData.verificationNotes}
                  onChange={e => setEditData({ ...editData, verificationNotes: e.target.value })}
                  className="w-full border rounded-md p-2 text-sm bg-slate-50 dark:bg-slate-950 min-h-[80px]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setIsEditing(false)} 
                className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-md"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <button onClick={cycleStatus} className="mt-0.5 hover:scale-110 transition-transform">
                  {STATUS_ICONS[task.status]}
                </button>
                <div>
                  <h3 className={`text-lg font-bold ${task.status === 'DONE' ? 'line-through text-slate-400' : ''}`}>
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider
                      ${task.priority === 1 ? 'bg-red-100 text-red-700 dark:bg-red-900/50' : 
                        task.priority === 2 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50' : 
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/50'}`
                    }>
                      {task.priority === 1 ? 'P1 Critical' : task.priority === 2 ? 'P2 High' : 'P3 Medium'}
                    </span>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {task.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onSplit(task.id)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                  title="Split Task"
                >
                  <SplitSquareVertical className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Edit
                </button>
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="mt-4 pt-4 border-t space-y-4 text-sm text-slate-600 dark:text-slate-300">
                {task.description && (
                  <div>
                    <strong className="text-slate-900 dark:text-slate-100 block mb-1">Description</strong>
                    <p className="whitespace-pre-wrap">{task.description}</p>
                  </div>
                )}
                {task.acceptanceCriteria && (
                  <div>
                    <strong className="text-slate-900 dark:text-slate-100 block mb-1">Acceptance Criteria</strong>
                    <p className="whitespace-pre-wrap bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border">{task.acceptanceCriteria}</p>
                  </div>
                )}
                {task.verificationNotes && (
                  <div>
                    <strong className="text-slate-900 dark:text-slate-100 block mb-1">Verification Notes</strong>
                    <p className="whitespace-pre-wrap">{task.verificationNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

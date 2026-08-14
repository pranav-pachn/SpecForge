"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, Activity, AlertTriangle, ListTodo, FileText, Settings, Play } from "lucide-react";
import { getWorkflowPipeline } from "../utils/workflowPipeline";

interface ActivityFeedProps {
  workflows: any[];
}

interface SyntheticEvent {
  id: string;
  type: 'APPROVED' | 'UPDATED' | 'DRIFT' | 'COMPLETED' | 'STARTED';
  message: string;
  workflowName: string;
  timestamp: Date;
}

export function ActivityFeed({ workflows }: ActivityFeedProps) {
  // Derive synthetic events from workflows
  const getEvents = (): SyntheticEvent[] => {
    let events: SyntheticEvent[] = [];
    
    workflows.forEach(wf => {
      const pipeline = getWorkflowPipeline(wf);
      const hasStale = pipeline.some(s => s.status === 'STALE');
      const wfDate = new Date(wf.updatedAt);
      
      if (hasStale) {
        events.push({
          id: `${wf.id}-drift`,
          type: 'DRIFT',
          message: 'Drift detected',
          workflowName: wf.name,
          timestamp: wfDate
        });
      } else if (wf.status === 'COMPLETED') {
        events.push({
          id: `${wf.id}-completed`,
          type: 'COMPLETED',
          message: 'Workflow completed',
          workflowName: wf.name,
          timestamp: wfDate
        });
      } else {
        // Find the "running" or latest "done" stage to describe what's happening
        const runningStage = pipeline.find(s => s.status === 'RUNNING');
        if (runningStage) {
           events.push({
            id: `${wf.id}-update`,
            type: 'STARTED',
            message: `${runningStage.label} in progress`,
            workflowName: wf.name,
            timestamp: wfDate
          });
        } else {
          // Find last done stage
          const reversedPipeline = [...pipeline].reverse();
          const lastDone = reversedPipeline.find(s => s.status === 'DONE');
          if (lastDone) {
            events.push({
              id: `${wf.id}-update`,
              type: 'APPROVED',
              message: `${lastDone.label} approved`,
              workflowName: wf.name,
              timestamp: wfDate
            });
          } else {
             events.push({
              id: `${wf.id}-update`,
              type: 'UPDATED',
              message: 'Workflow created',
              workflowName: wf.name,
              timestamp: new Date(wf.createdAt)
            });
          }
        }
      }
    });

    // Sort by timestamp desc and take top 5
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);
  };

  const events = getEvents();

  const EventIcon = ({ type }: { type: SyntheticEvent['type'] }) => {
    switch (type) {
      case 'APPROVED':
      case 'COMPLETED': return <Check className="w-4 h-4 text-green-500" />;
      case 'STARTED': return <Play className="w-4 h-4 text-blue-500 fill-blue-500" />;
      case 'DRIFT': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'UPDATED':
      default: return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  if (events.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 text-center text-slate-500 text-sm">
        No recent activity.
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-32 bg-blue-500/5 blur-[100px] rounded-full -z-10" />
      
      <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">
        Recent Activity
      </h3>
      
      <div className="space-y-6">
        {events.map((event, i) => (
          <div key={event.id} className="flex gap-4 animate-up" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex flex-col items-center mt-0.5">
              <EventIcon type={event.type} />
              {i !== events.length - 1 && (
                <div className="w-px h-full bg-slate-200 dark:bg-slate-800 mt-2 min-h-[24px]" />
              )}
            </div>
            <div>
              <p className={`text-sm font-semibold ${event.type === 'DRIFT' ? 'text-orange-600 dark:text-orange-400' : 'text-slate-900 dark:text-slate-100'}`}>
                {event.message}
              </p>
              <p className="text-xs font-medium text-slate-500 mt-0.5 line-clamp-1">{event.workflowName}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                {formatDistanceToNow(event.timestamp)} ago
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

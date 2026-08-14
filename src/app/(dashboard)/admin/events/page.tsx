"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ListFilter } from "lucide-react";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/admin/events");
        const json = await res.json();
        setEvents(json.events || []);
      } catch (e) {
        console.error(e);
      }
    };

    fetchEvents();
    // Simulate SSE with frequent polling for now
    const interval = setInterval(fetchEvents, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-200">Live Event Timeline</h2>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Live
        </div>
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Workflow ID</th>
              <th className="px-4 py-3 font-medium">Seq</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => alert(JSON.stringify(event.payload, null, 2))}>
                <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                  {format(new Date(event.occurredAt), "HH:mm:ss.SSS")}
                </td>
                <td className="px-4 py-3 text-blue-400 font-medium">
                  {event.type}
                </td>
                <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                  {event.workflowId || "System"}
                </td>
                <td className="px-4 py-3 text-slate-500 font-mono">
                  #{event.sequence}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    event.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' :
                    event.status === 'QUEUED' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-slate-500/10 text-slate-400'
                  }`}>
                    {event.status}
                  </span>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No events recorded recently.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

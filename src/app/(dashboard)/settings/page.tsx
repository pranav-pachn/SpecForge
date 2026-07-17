"use client";

import { useState, useEffect } from "react";
import { FEATURE_FLAGS } from "@/config/feature-flags";
import { Database, Activity, ToggleLeft, RefreshCcw, Loader2, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/analytics")
      .then(res => res.json())
      .then(data => {
        if (!data.error) setAnalytics(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSeedDemo = async () => {
    setSeeding(true);
    setSeedSuccess(false);
    try {
      await fetch("/api/seed", { method: "POST" });
      setSeedSuccess(true);
      // Refresh analytics
      const res = await fetch("/api/analytics");
      const data = await res.json();
      if (!data.error) setAnalytics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Platform Settings</h1>
        <p className="text-slate-500 mt-2">Manage your workspace, view analytics, and configure feature flags.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Analytics Card */}
        <div className="md:col-span-2 glass border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Platform Analytics
            </h3>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
          </div>
          <div className="p-6">
            {!loading && analytics ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-xl text-center">
                    <p className="text-sm font-medium text-slate-500 mb-1">Workflows</p>
                    <p className="text-2xl font-bold">{analytics.stats.workflows}</p>
                  </div>
                  <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-xl text-center">
                    <p className="text-sm font-medium text-slate-500 mb-1">Artifacts</p>
                    <p className="text-2xl font-bold">{analytics.stats.artifacts}</p>
                  </div>
                  <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-xl text-center">
                    <p className="text-sm font-medium text-slate-500 mb-1">Tasks</p>
                    <p className="text-2xl font-bold">{analytics.stats.tasks}</p>
                  </div>
                  <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-xl text-center">
                    <p className="text-sm font-medium text-slate-500 mb-1">Events</p>
                    <p className="text-2xl font-bold">{analytics.stats.events}</p>
                  </div>
                </div>
                
                {analytics.recentEvents?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Recent Activity</h4>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin">
                      {analytics.recentEvents.map((evt: any) => (
                        <div key={evt.id} className="text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-white/5 flex justify-between">
                          <span className="font-medium">{evt.eventType}</span>
                          <span className="text-slate-500 text-xs">{new Date(evt.createdAt).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : !loading ? (
              <p className="text-slate-500 text-center py-8">Failed to load analytics</p>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-400">Loading...</div>
            )}
          </div>
        </div>

        {/* System Config */}
        <div className="space-y-6">
          <div className="glass border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <ToggleLeft className="w-5 h-5 text-purple-500" />
                Feature Flags
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {Object.entries(FEATURE_FLAGS).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${value ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                      {value ? 'ON' : 'OFF'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-500" />
                Data Management
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-500">
                Seed the database with a complete demo user, workspace, project, and workflow.
              </p>
              <button
                onClick={handleSeedDemo}
                disabled={seeding}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
              >
                {seeding ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Seeding...</>
                ) : seedSuccess ? (
                  <><CheckCircle2 className="w-4 h-4 text-green-500" /> Seeded successfully!</>
                ) : (
                  <><RefreshCcw className="w-4 h-4" /> Seed Demo Data</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

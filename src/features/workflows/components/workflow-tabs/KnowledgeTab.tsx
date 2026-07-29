"use client";

import { useEffect, useState } from "react";
import { Database, Zap, Clock, Search, RefreshCw, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface KnowledgeStats {
  count: number;
  lastIndexed: string | null;
}

export default function KnowledgeTab({ workflowId }: { workflowId: string }) {
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [workflowId]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/workflows/${workflowId}/knowledge`);
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (e) {
      console.error("Failed to fetch knowledge stats", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/knowledge?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (e) {
      console.error("Search failed", e);
    } finally {
      setIsSearching(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading knowledge graph...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            Engineering Knowledge Graph
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Continuously embedding workflow artifacts for context-aware generation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 rounded-lg">
            <FileText className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats?.count || 0}</div>
            <div className="text-sm text-slate-400">Nodes Indexed</div>
          </div>
        </div>

        <div className="glass p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-green-500/20 rounded-lg">
            <Zap className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <div className="text-lg font-medium text-green-400">Healthy</div>
            <div className="text-sm text-slate-400">System Status</div>
          </div>
        </div>

        <div className="glass p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <Clock className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="text-sm font-medium">
              {stats?.lastIndexed ? formatDistanceToNow(new Date(stats.lastIndexed), { addSuffix: true }) : "Never"}
            </div>
            <div className="text-sm text-slate-400">Last Indexed</div>
          </div>
        </div>
      </div>

      <div className="glass p-6 rounded-xl border border-white/5 space-y-4">
        <h3 className="font-medium text-lg">Query the Graph</h3>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="e.g., 'What are the requirements for Google Login?'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button 
            type="submit" 
            disabled={isSearching || !query.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </form>

        {results.length > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-medium text-slate-400">Top Context Retrieved:</h4>
            {results.map((res: any) => (
              <div key={res.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">
                    {res.type}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Score: {res.finalScore?.toFixed(2) || (res.similarity ? (res.similarity * 0.45 + (res.importanceScore || 0.5) * 0.3).toFixed(2) : 'N/A')}
                  </span>
                </div>
                <h5 className="font-medium mb-1">{res.title}</h5>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{res.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

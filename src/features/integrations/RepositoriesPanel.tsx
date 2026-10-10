"use client";

import { useEffect, useState, type FormEvent } from "react";

interface Connection {
  id: string;
  owner: string;
  repo: string;
  installationId: string | null;
  createdAt?: string;
}

export function RepositoriesPanel() {
  const [connections, setConnections] = useState<Connection[] | null>(null);
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/integrations/github/connections");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Could not load repositories");
    setConnections(data);
  }

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/github/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not connect repository");
      setOwner("");
      setRepo("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect repository");
    } finally {
      setSaving(false);
    }
  }

  async function disconnect(id: string) {
    const res = await fetch(`/api/integrations/github/connections/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not disconnect repository");
      return;
    }
    await load();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Repositories</h1>
        <p className="mt-1 text-sm text-slate-400">
          Connect a GitHub repository so signed pull_request webhooks can start a review.
          SpecForge requests contents read, pull requests read, and checks write.
        </p>
      </div>

      <section className="rounded-xl border border-slate-800 p-4 text-sm text-slate-300 space-y-2">
        <p>Webhook URL</p>
        <p className="font-mono text-xs text-slate-400">/api/integrations/github/webhook</p>
        <p>Set <span className="font-mono">GITHUB_WEBHOOK_SECRET</span> on the server. Reviews run only for repositories listed here. A missing diff or a failed check is recorded as incomplete, never as a pass.</p>
      </section>

      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          aria-label="Repository owner"
          value={owner}
          onChange={(event) => setOwner(event.target.value)}
          placeholder="owner"
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          required
        />
        <input
          aria-label="Repository name"
          value={repo}
          onChange={(event) => setRepo(event.target.value)}
          placeholder="repo"
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          required
        />
        <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50">
          {saving ? "Connecting…" : "Connect"}
        </button>
      </form>
      {error && <p className="text-red-400">{error}</p>}

      {connections && connections.length === 0 && <p className="text-slate-500">No repositories connected.</p>}
      <ul className="space-y-2">
        {connections?.map((connection) => (
          <li key={connection.id} className="flex items-center justify-between rounded-xl border border-slate-800 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-100">{connection.owner}/{connection.repo}</p>
              <p className="text-xs text-slate-500">
                {connection.installationId ? `Installation ${connection.installationId}` : "Waiting for a webhook to record the installation id"}
              </p>
            </div>
            <button type="button" onClick={() => disconnect(connection.id)} className="text-sm text-slate-400 hover:text-red-300">
              Disconnect
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

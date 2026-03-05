"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";

type Agent = {
  id: string;
  name: string;
  role: string;
  device: string;
  mission: string;
  parentId: string | null;
};

function AgentTree({ agents, parentId = null, level = 0 }: { agents: Agent[]; parentId?: string | null; level?: number }) {
  const children = agents.filter((agent) => agent.parentId === parentId);

  if (children.length === 0) return null;

  return (
    <ul className="space-y-1">
      {children.map((agent) => (
        <li key={agent.id}>
          <div
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            style={{ marginLeft: `${level * 14}px` }}
          >
            <span className="font-semibold">{agent.name}</span>
            <span className="ml-2 text-muted">{agent.role}</span>
          </div>
          <AgentTree agents={agents} parentId={agent.id} level={level + 1} />
        </li>
      ))}
    </ul>
  );
}

async function fetchJson<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export default function TeamPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    role: "",
    device: "",
    mission: "",
    parentId: "",
  });

  const byId = useMemo(() => new Map(agents.map((agent) => [agent.id, agent])), [agents]);

  async function loadAgents() {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchJson<Agent[]>("/api/agents");
      setAgents(data);
    } catch {
      setError("Could not load agents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAgents();
  }, []);

  async function createAgent(event: FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      const created = await fetchJson<Agent>("/api/agents", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          role: form.role,
          device: form.device,
          mission: form.mission,
          parentId: form.parentId || null,
        }),
      });
      setAgents((prev) => [...prev, created]);
      setForm({ name: "", role: "", device: "", mission: "", parentId: "" });
    } catch {
      setError("Could not create agent.");
    }
  }

  return (
    <section>
      <PageHeader
        title="Team / Org"
        subtitle="Track agents, responsibilities, device context, and parent-child reporting lines."
      />

      <div className="mb-5 grid gap-5 xl:grid-cols-[360px_1fr]">
        <form onSubmit={createAgent} className="glass-panel space-y-2 p-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em]">Add Agent</h3>
          <input
            className="input"
            placeholder="Name"
            value={form.name}
            required
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <input
            className="input"
            placeholder="Role"
            value={form.role}
            required
            onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
          />
          <input
            className="input"
            placeholder="Device"
            value={form.device}
            required
            onChange={(event) => setForm((prev) => ({ ...prev, device: event.target.value }))}
          />
          <textarea
            className="textarea"
            rows={3}
            placeholder="Mission"
            value={form.mission}
            required
            onChange={(event) => setForm((prev) => ({ ...prev, mission: event.target.value }))}
          />
          <select
            className="select"
            value={form.parentId}
            onChange={(event) => setForm((prev) => ({ ...prev, parentId: event.target.value }))}
          >
            <option value="">No parent</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" type="submit">
            Save Agent
          </button>
        </form>

        <div className="space-y-3">
          <article className="glass-panel p-4">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.16em]">Hierarchy</h3>
            {loading ? <p className="text-sm text-muted">Loading hierarchy...</p> : <AgentTree agents={agents} />}
          </article>

          <article className="glass-panel overflow-x-auto p-4">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.16em]">Agent Roster</h3>
            <table className="text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-[0.14em] text-muted">
                  <th className="py-2">Name</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Device</th>
                  <th className="py-2">Parent</th>
                  <th className="py-2">Mission</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id} className="border-b border-border/70 align-top">
                    <td className="py-2 font-semibold">{agent.name}</td>
                    <td className="py-2">{agent.role}</td>
                    <td className="py-2">{agent.device}</td>
                    <td className="py-2">{agent.parentId ? byId.get(agent.parentId)?.name ?? "-" : "-"}</td>
                    <td className="py-2 text-muted">{agent.mission}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        </div>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </section>
  );
}

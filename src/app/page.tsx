"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/stat-card";
import { TaskBoard } from "@/components/task-board";
import { PageHeader } from "@/components/page-header";
import { taskStatuses } from "@/lib/constants";

type DashboardTask = {
  id: string;
  title: string;
  description: string | null;
  status: (typeof taskStatuses)[number];
  assigneeId: string | null;
  projectId: string | null;
  assignee?: { id: string; name: string } | null;
  project?: { id: string; name: string } | null;
};

type DashboardStats = {
  agents: number;
  documents: number;
  jobs: number;
  memories: number;
  projects: number;
};

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
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

export default function DashboardPage() {
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    agents: 0,
    documents: 0,
    jobs: 0,
    memories: 0,
    projects: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);

      try {
        const [taskData, projects, memories, documents, agents, jobs] = await Promise.all([
          fetchJson<DashboardTask[]>("/api/tasks"),
          fetchJson<Array<{ id: string }>>("/api/projects"),
          fetchJson<Array<{ id: string }>>("/api/memories"),
          fetchJson<Array<{ id: string }>>("/api/documents"),
          fetchJson<Array<{ id: string }>>("/api/agents"),
          fetchJson<Array<{ id: string }>>("/api/jobs"),
        ]);

        setTasks(taskData);
        setStats({
          agents: agents.length,
          documents: documents.length,
          jobs: jobs.length,
          memories: memories.length,
          projects: projects.length,
        });
      } catch {
        setError("Could not load dashboard data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section>
      <PageHeader
        title="Dashboard"
        subtitle="Track work, people, records, and scheduled operations from one mission cockpit."
      />

      <div className="card-grid mb-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Tasks" value={tasks.length} />
        <StatCard label="Projects" value={stats.projects} />
        <StatCard label="Memories" value={stats.memories} />
        <StatCard label="Documents" value={stats.documents} />
        <StatCard label="Agents" value={stats.agents} />
        <StatCard label="Jobs" value={stats.jobs} />
      </div>

      {loading ? <p className="mb-4 text-sm text-muted">Loading dashboard data...</p> : null}
      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}

      <TaskBoard initialTasks={tasks} />
    </section>
  );
}

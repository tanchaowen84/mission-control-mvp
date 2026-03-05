"use client";

import { FormEvent, useEffect, useState } from "react";
import { taskStatusLabels, taskStatuses } from "@/lib/constants";

type Agent = {
  id: string;
  name: string;
};

type Project = {
  id: string;
  name: string;
};

type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: (typeof taskStatuses)[number];
  assigneeId: string | null;
  projectId: string | null;
  assignee?: Agent | null;
  project?: Project | null;
};

async function jsonFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
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

export function TaskBoard({ initialTasks }: { initialTasks: TaskItem[] }) {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assigneeId: "",
    projectId: "",
  });

  useEffect(() => {
    if (agents.length > 0 || projects.length > 0 || loadingMeta) return;

    void (async () => {
      setLoadingMeta(true);
      try {
        const [agentData, projectData, taskData] = await Promise.all([
          jsonFetch<Agent[]>("/api/agents"),
          jsonFetch<Project[]>("/api/projects"),
          jsonFetch<TaskItem[]>("/api/tasks"),
        ]);
        setAgents(agentData);
        setProjects(projectData);
        setTasks(taskData);
      } catch {
        setError("Could not load task board data.");
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, [agents.length, loadingMeta, projects.length]);

  async function createTask(event: FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      const created = await jsonFetch<TaskItem>("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          assigneeId: form.assigneeId || null,
          projectId: form.projectId || null,
          status: "TODO",
        }),
      });

      setTasks((prev) => [created, ...prev]);
      setForm({ title: "", description: "", assigneeId: "", projectId: "" });
    } catch {
      setError("Could not create task.");
    }
  }

  async function moveTask(taskId: string, status: (typeof taskStatuses)[number]) {
    const existing = tasks.find((task) => task.id === taskId);
    if (!existing || existing.status === status) return;

    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status } : task)));

    try {
      await jsonFetch<TaskItem>(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    } catch {
      setTasks((prev) => prev.map((task) => (task.id === taskId ? existing : task)));
      setError("Could not move task.");
    }
  }

  const grouped = taskStatuses.map((status) => ({
    status,
    tasks: tasks.filter((task) => task.status === status),
  }));

  return (
    <div className="space-y-4">
      <section className="glass-panel p-4">
        <h3 className="mb-3 text-base font-semibold">Create Task</h3>
        <form onSubmit={createTask} className="grid gap-2 md:grid-cols-4">
          <input
            className="input"
            placeholder="Task title"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
          <input
            className="input"
            placeholder="Description"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
          <select
            className="select"
            value={form.assigneeId}
            onChange={(event) => setForm((prev) => ({ ...prev, assigneeId: event.target.value }))}
          >
            <option value="">Unassigned</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <select
              className="select"
              value={form.projectId}
              onChange={(event) => setForm((prev) => ({ ...prev, projectId: event.target.value }))}
            >
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <button className="btn btn-primary" type="submit">
              Add
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-3 lg:grid-cols-4">
        {grouped.map(({ status, tasks: statusTasks }) => (
          <article
            key={status}
            className="glass-panel min-h-[360px] p-3"
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragTaskId) {
                void moveTask(dragTaskId, status);
              }
              setDragTaskId(null);
            }}
          >
            <header className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-[0.15em]">{taskStatusLabels[status]}</h3>
              <span className="badge">{statusTasks.length}</span>
            </header>

            <div className="space-y-2">
              {statusTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => setDragTaskId(task.id)}
                  className="cursor-grab rounded-xl border border-border bg-surface p-2"
                >
                  <p className="text-sm font-semibold">{task.title}</p>
                  {task.description ? <p className="mt-1 text-xs text-muted">{task.description}</p> : null}
                  <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-muted">
                    <span className="badge">{task.assignee?.name ?? "Unassigned"}</span>
                    {task.project ? <span className="badge">{task.project.name}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}

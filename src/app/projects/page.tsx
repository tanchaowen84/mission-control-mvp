"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { projectStatusLabels, projectStatuses } from "@/lib/constants";

type Task = {
  id: string;
  title: string;
  assignee?: { name: string } | null;
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: (typeof projectStatuses)[number];
  tasks: Task[];
};

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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", status: "PLANNING" });

  async function loadProjects() {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchJson<Project[]>("/api/projects");
      setProjects(data);
    } catch {
      setError("Could not load projects.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProjects();
  }, []);

  async function createProject(event: FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      const project = await fetchJson<Project>("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          status: form.status,
        }),
      });
      setProjects((prev) => [{ ...project, tasks: [] }, ...prev]);
      setForm({ name: "", description: "", status: "PLANNING" });
    } catch {
      setError("Could not create project.");
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const updated = await fetchJson<Project>(`/api/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      setProjects((prev) => prev.map((project) => (project.id === id ? { ...project, ...updated } : project)));
    } catch {
      setError("Could not update project status.");
    }
  }

  return (
    <section>
      <PageHeader
        title="Projects"
        subtitle="Monitor project health and the tasks linked to each initiative."
      />

      <div className="mb-5 grid gap-5 xl:grid-cols-[360px_1fr]">
        <form onSubmit={createProject} className="glass-panel space-y-2 p-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em]">New Project</h3>
          <input
            className="input"
            placeholder="Project name"
            value={form.name}
            required
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <textarea
            className="textarea"
            placeholder="Description"
            rows={4}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
          <select
            className="select"
            value={form.status}
            onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
          >
            {projectStatuses.map((status) => (
              <option key={status} value={status}>
                {projectStatusLabels[status]}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" type="submit">
            Create Project
          </button>
        </form>

        <div className="space-y-3">
          {loading ? <p className="text-sm text-muted">Loading projects...</p> : null}
          {projects.map((project) => (
            <article key={project.id} className="glass-panel p-4">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold">{project.name}</h3>
                  {project.description ? <p className="text-sm text-muted">{project.description}</p> : null}
                </div>
                <select
                  className="select max-w-[180px]"
                  value={project.status}
                  onChange={(event) => void updateStatus(project.id, event.target.value)}
                >
                  {projectStatuses.map((status) => (
                    <option key={status} value={status}>
                      {projectStatusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.14em] text-muted">Linked Tasks ({project.tasks.length})</p>
                {project.tasks.length === 0 ? (
                  <p className="text-sm text-muted">No linked tasks yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {project.tasks.map((task) => (
                      <li key={task.id} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                        <span className="font-semibold">{task.title}</span>
                        {task.assignee?.name ? <span className="ml-2 text-muted">• {task.assignee.name}</span> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </section>
  );
}

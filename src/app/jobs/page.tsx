"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";

type Job = {
  id: string;
  name: string;
  cronExpression: string;
  nextRun: string;
  enabled: boolean;
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

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    cronExpression: "0 0 * * *",
    nextRun: new Date().toISOString().slice(0, 16),
    enabled: true,
  });

  async function loadJobs() {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchJson<Job[]>("/api/jobs");
      setJobs(data);
    } catch {
      setError("Could not load jobs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadJobs();
  }, []);

  async function createJob(event: FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      const created = await fetchJson<Job>("/api/jobs", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          cronExpression: form.cronExpression,
          nextRun: new Date(form.nextRun).toISOString(),
          enabled: form.enabled,
        }),
      });
      setJobs((prev) => [...prev, created]);
      setForm({
        name: "",
        cronExpression: "0 0 * * *",
        nextRun: new Date().toISOString().slice(0, 16),
        enabled: true,
      });
    } catch {
      setError("Could not create job.");
    }
  }

  async function toggleJob(job: Job) {
    try {
      const updated = await fetchJson<Job>(`/api/jobs/${job.id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !job.enabled }),
      });

      setJobs((prev) => prev.map((current) => (current.id === job.id ? updated : current)));
    } catch {
      setError("Could not toggle job.");
    }
  }

  return (
    <section>
      <PageHeader
        title="Scheduler / Cron Jobs"
        subtitle="Simulate scheduler state with next-run tracking and on/off toggles."
      />

      <div className="mb-5 grid gap-5 xl:grid-cols-[360px_1fr]">
        <form onSubmit={createJob} className="glass-panel space-y-2 p-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em]">New Job</h3>
          <input
            className="input"
            placeholder="Job name"
            value={form.name}
            required
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <input
            className="input"
            placeholder="Cron expression"
            value={form.cronExpression}
            required
            onChange={(event) => setForm((prev) => ({ ...prev, cronExpression: event.target.value }))}
          />
          <input
            className="input"
            type="datetime-local"
            value={form.nextRun}
            required
            onChange={(event) => setForm((prev) => ({ ...prev, nextRun: event.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) => setForm((prev) => ({ ...prev, enabled: event.target.checked }))}
            />
            Enabled
          </label>
          <button className="btn btn-primary" type="submit">
            Save Job
          </button>
        </form>

        <article className="glass-panel overflow-x-auto p-4">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.16em]">Scheduled Jobs</h3>
          {loading ? <p className="text-sm text-muted">Loading jobs...</p> : null}
          <table className="text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-[0.14em] text-muted">
                <th className="py-2">Name</th>
                <th className="py-2">Cron</th>
                <th className="py-2">Next Run</th>
                <th className="py-2">Enabled</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-border/70">
                  <td className="py-2 font-semibold">{job.name}</td>
                  <td className="py-2 font-mono text-xs">{job.cronExpression}</td>
                  <td className="py-2">{new Date(job.nextRun).toLocaleString()}</td>
                  <td className="py-2">
                    <button className="btn" onClick={() => void toggleJob(job)} type="button">
                      {job.enabled ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </section>
  );
}

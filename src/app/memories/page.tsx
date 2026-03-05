"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";

type Memory = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  occurredAt: string;
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

export default function MemoriesPage() {
  const [query, setQuery] = useState("");
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", tags: "" });

  async function loadMemories(search = "") {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchJson<Memory[]>(`/api/memories${search ? `?q=${encodeURIComponent(search)}` : ""}`);
      setMemories(data);
    } catch {
      setError("Could not load memories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMemories();
  }, []);

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    await loadMemories(query);
  }

  async function createMemory(event: FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      const tags = form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const created = await fetchJson<Memory>("/api/memories", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          tags,
          occurredAt: new Date().toISOString(),
        }),
      });

      setMemories((prev) => [created, ...prev]);
      setForm({ title: "", content: "", tags: "" });
    } catch {
      setError("Could not create memory.");
    }
  }

  return (
    <section>
      <PageHeader
        title="Memories"
        subtitle="Capture timeline notes and quickly search institutional memory by text and tags."
      />

      <div className="mb-5 grid gap-5 xl:grid-cols-[360px_1fr]">
        <form onSubmit={createMemory} className="glass-panel space-y-2 p-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em]">New Memory</h3>
          <input
            className="input"
            placeholder="Title"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
          <textarea
            className="textarea"
            placeholder="What happened?"
            rows={5}
            value={form.content}
            onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
            required
          />
          <input
            className="input"
            placeholder="Tags, comma-separated"
            value={form.tags}
            onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
          />
          <button className="btn btn-primary" type="submit">
            Save Memory
          </button>
        </form>

        <div className="space-y-3">
          <form onSubmit={onSearch} className="glass-panel flex gap-2 p-3">
            <input
              className="input"
              placeholder="Search title, content, tags"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button className="btn" type="submit">
              Search
            </button>
          </form>

          {loading ? <p className="text-sm text-muted">Loading memories...</p> : null}
          {memories.map((memory) => (
            <article key={memory.id} className="glass-panel p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-bold">{memory.title}</h3>
                <span className="text-xs text-muted">{new Date(memory.occurredAt).toLocaleString()}</span>
              </div>
              <p className="text-sm leading-relaxed">{memory.content}</p>
              {memory.tags.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {memory.tags.map((tag) => (
                    <span key={tag} className="badge">
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </section>
  );
}

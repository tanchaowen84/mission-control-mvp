"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";

type DocumentItem = {
  id: string;
  title: string;
  fileName: string;
  contentType: string;
  description: string | null;
  textContent: string | null;
  sourceUrl: string | null;
  createdAt: string;
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

export default function DocumentsPage() {
  const [query, setQuery] = useState("");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    fileName: "",
    contentType: "text/plain",
    description: "",
    textContent: "",
    sourceUrl: "",
  });

  async function loadDocuments(search = "") {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchJson<DocumentItem[]>(`/api/documents${search ? `?q=${encodeURIComponent(search)}` : ""}`);
      setDocuments(data);
    } catch {
      setError("Could not load documents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDocuments();
  }, []);

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    await loadDocuments(query);
  }

  async function createDocument(event: FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      const created = await fetchJson<DocumentItem>("/api/documents", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          fileName: form.fileName,
          contentType: form.contentType,
          description: form.description || null,
          textContent: form.textContent || null,
          sourceUrl: form.sourceUrl || null,
        }),
      });

      setDocuments((prev) => [created, ...prev]);
      setForm({
        title: "",
        fileName: "",
        contentType: "text/plain",
        description: "",
        textContent: "",
        sourceUrl: "",
      });
    } catch {
      setError("Could not save document.");
    }
  }

  return (
    <section>
      <PageHeader
        title="Documents"
        subtitle="Upload metadata and searchable text to build a fast operational document center."
      />

      <div className="mb-5 grid gap-5 xl:grid-cols-[360px_1fr]">
        <form onSubmit={createDocument} className="glass-panel space-y-2 p-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em]">Add Document</h3>
          <input
            className="input"
            placeholder="Title"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
          <input
            className="input"
            placeholder="File name"
            value={form.fileName}
            onChange={(event) => setForm((prev) => ({ ...prev, fileName: event.target.value }))}
            required
          />
          <input
            className="input"
            placeholder="Content type"
            value={form.contentType}
            onChange={(event) => setForm((prev) => ({ ...prev, contentType: event.target.value }))}
            required
          />
          <textarea
            className="textarea"
            rows={2}
            placeholder="Description"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
          <textarea
            className="textarea"
            rows={4}
            placeholder="Extracted text content for full-text search"
            value={form.textContent}
            onChange={(event) => setForm((prev) => ({ ...prev, textContent: event.target.value }))}
          />
          <input
            className="input"
            placeholder="Source URL"
            value={form.sourceUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, sourceUrl: event.target.value }))}
          />
          <button className="btn btn-primary" type="submit">
            Save Document
          </button>
        </form>

        <div className="space-y-3">
          <form onSubmit={onSearch} className="glass-panel flex gap-2 p-3">
            <input
              className="input"
              placeholder="Search title, file name, description, content"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button className="btn" type="submit">
              Search
            </button>
          </form>

          {loading ? <p className="text-sm text-muted">Loading documents...</p> : null}
          {documents.map((document) => (
            <article key={document.id} className="glass-panel p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-bold">{document.title}</h3>
                <span className="badge">{document.contentType}</span>
              </div>
              <p className="text-xs text-muted">{document.fileName}</p>
              {document.description ? <p className="mt-2 text-sm">{document.description}</p> : null}
              {document.textContent ? (
                <p className="mt-2 rounded-lg border border-border bg-surface p-2 text-sm text-muted">{document.textContent}</p>
              ) : null}
              {document.sourceUrl ? (
                <a className="mt-2 inline-block text-sm text-accent underline" href={document.sourceUrl}>
                  Source
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </section>
  );
}

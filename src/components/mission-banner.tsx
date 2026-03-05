"use client";

import { FormEvent, useEffect, useState } from "react";

type MissionResponse = {
  id: string;
  statement: string;
  updatedAt: string;
};

export function MissionBanner() {
  const [statement, setStatement] = useState("");
  const [draft, setDraft] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadMission() {
      try {
        const response = await fetch("/api/mission", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load mission");
        const data = (await response.json()) as MissionResponse;
        if (!active) return;
        setStatement(data.statement);
        setDraft(data.statement);
      } catch {
        if (active) setError("Could not load mission statement.");
      }
    }

    void loadMission();

    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/mission", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statement: draft }),
      });

      if (!response.ok) {
        throw new Error("Update failed");
      }

      const data = (await response.json()) as MissionResponse;
      setStatement(data.statement);
      setDraft(data.statement);
      setIsEditing(false);
    } catch {
      setError("Could not save mission statement.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="glass-panel p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm uppercase tracking-[0.24em] text-muted">Mission Control</h2>
        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted hover:border-accent hover:text-foreground"
          >
            Edit Mission
          </button>
        ) : null}
      </div>

      {!isEditing ? (
        <p className="text-lg font-semibold leading-relaxed md:text-xl">{statement || "Loading mission..."}</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none ring-accent/60 transition focus:ring"
            placeholder="Define the mission"
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-accent-contrast disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(statement);
                setIsEditing(false);
              }}
              className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </section>
  );
}

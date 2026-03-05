"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";

type Desk = {
  id: string;
  label: string;
  x: number;
  y: number;
  agent: {
    id: string;
    name: string;
    role: string;
  } | null;
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

export default function OfficePage() {
  const [desks, setDesks] = useState<Desk[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await fetchJson<Desk[]>("/api/desks");
        setDesks(data);
      } catch {
        setError("Could not load office layout.");
      }
    })();
  }, []);

  const cells = useMemo(() => {
    const map = new Map<string, Desk>();
    for (const desk of desks) {
      map.set(`${desk.x}-${desk.y}`, desk);
    }
    return map;
  }, [desks]);

  return (
    <section>
      <PageHeader
        title="Office View"
        subtitle="Lightweight 2D map of desk placements and current agent seating."
      />

      <article className="glass-panel overflow-auto p-4">
        <div className="grid min-w-[640px] grid-cols-6 gap-3">
          {Array.from({ length: 36 }).map((_, index) => {
            const x = (index % 6) + 1;
            const y = Math.floor(index / 6) + 1;
            const desk = cells.get(`${x}-${y}`);

            return (
              <div key={`${x}-${y}`} className="rounded-xl border border-border bg-surface p-2 text-xs">
                <p className="mb-1 font-mono text-[10px] text-muted">
                  {x},{y}
                </p>
                {desk ? (
                  <>
                    <p className="font-semibold">Desk {desk.label}</p>
                    <p className="text-muted">{desk.agent?.name ?? "Unassigned"}</p>
                    {desk.agent?.role ? <p className="text-muted">{desk.agent.role}</p> : null}
                  </>
                ) : (
                  <p className="text-muted">Walkway</p>
                )}
              </div>
            );
          })}
        </div>
      </article>

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </section>
  );
}

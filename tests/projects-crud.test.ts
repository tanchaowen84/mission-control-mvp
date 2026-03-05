import { beforeEach, describe, expect, it, vi } from "vitest";

type MockProject = {
  id: string;
  name: string;
  description: string | null;
  status: "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED";
  tasks: [];
};

const projectStore: MockProject[] = [];

vi.mock("@/lib/db", () => {
  return {
    db: {
      project: {
        findMany: vi.fn(async () => [...projectStore]),
        create: vi.fn(async ({
          data,
        }: {
          data: {
            name: string;
            description?: string | null;
            status?: MockProject["status"];
          };
        }) => {
          const created: MockProject = {
            id: `project-${projectStore.length + 1}`,
            name: data.name,
            description: data.description ?? null,
            status: data.status ?? "PLANNING",
            tasks: [],
          };
          projectStore.push(created);
          return created;
        }),
      },
    },
  };
});

describe("/api/projects CRUD", () => {
  beforeEach(() => {
    projectStore.length = 0;
  });

  it("creates then lists a project", async () => {
    const { POST, GET } = await import("@/app/api/projects/route");

    const postResponse = await POST(
      new Request("http://localhost/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Mission QA",
          description: "Validate MVP delivery pipeline",
          status: "ACTIVE",
        }),
      }),
    );

    expect(postResponse.status).toBe(201);
    const created = await postResponse.json();
    expect(created.name).toBe("Mission QA");
    expect(created.status).toBe("ACTIVE");

    const listResponse = await GET();
    expect(listResponse.status).toBe(200);

    const list = await listResponse.json();
    expect(Array.isArray(list)).toBe(true);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("Mission QA");
  });
});

import { db } from "@/lib/db";
import { StatCard } from "@/components/stat-card";
import { TaskBoard } from "@/components/task-board";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [tasks, projects, memories, documents, agents, jobs] = await Promise.all([
    db.task.findMany({ orderBy: { createdAt: "desc" }, include: { assignee: true, project: true } }),
    db.project.count(),
    db.memory.count(),
    db.document.count(),
    db.agent.count(),
    db.job.count(),
  ]);

  return (
    <section>
      <PageHeader
        title="Dashboard"
        subtitle="Track work, people, records, and scheduled operations from one mission cockpit."
      />

      <div className="card-grid mb-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Tasks" value={tasks.length} />
        <StatCard label="Projects" value={projects} />
        <StatCard label="Memories" value={memories} />
        <StatCard label="Documents" value={documents} />
        <StatCard label="Agents" value={agents} />
        <StatCard label="Jobs" value={jobs} />
      </div>

      <TaskBoard initialTasks={tasks} />
    </section>
  );
}

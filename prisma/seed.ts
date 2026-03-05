import { PrismaClient, ProjectStatus, TaskStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.task.deleteMany();
  await prisma.memory.deleteMany();
  await prisma.document.deleteMany();
  await prisma.job.deleteMany();
  await prisma.desk.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.project.deleteMany();
  await prisma.mission.deleteMany();

  await prisma.mission.create({
    data: {
      statement: "Ship reliable OpenClaw operations by coordinating tasks, teams, and knowledge in one place.",
    },
  });

  const [apollo, hermes, atlas] = await Promise.all([
    prisma.project.create({
      data: {
        name: "Apollo Rollout",
        description: "Coordinate the next production release and guardrail checks.",
        status: ProjectStatus.ACTIVE,
      },
    }),
    prisma.project.create({
      data: {
        name: "Hermes Docs Sync",
        description: "Backfill and normalize internal docs into shared knowledge center.",
        status: ProjectStatus.PLANNING,
      },
    }),
    prisma.project.create({
      data: {
        name: "Atlas Monitoring",
        description: "Improve reliability metrics and alert routing.",
        status: ProjectStatus.ON_HOLD,
      },
    }),
  ]);

  const [lea, ken, maya, rui] = await Promise.all([
    prisma.agent.create({
      data: {
        name: "Lea Chen",
        role: "Mission Lead",
        device: "macOS MBP",
        mission: "Keep cross-team execution aligned to release priorities.",
      },
    }),
    prisma.agent.create({
      data: {
        name: "Ken Ortiz",
        role: "Backend Agent",
        device: "Linux Workstation",
        mission: "Ship robust APIs and scheduler reliability.",
      },
    }),
    prisma.agent.create({
      data: {
        name: "Maya Singh",
        role: "Docs Agent",
        device: "Windows 11",
        mission: "Maintain accurate knowledge base and search quality.",
      },
    }),
    prisma.agent.create({
      data: {
        name: "Rui Tan",
        role: "Ops Agent",
        device: "Ubuntu Laptop",
        mission: "Operate cron jobs and incident response workflows.",
      },
    }),
  ]);

  await prisma.agent.update({
    where: { id: ken.id },
    data: { parentId: lea.id },
  });
  await prisma.agent.update({
    where: { id: maya.id },
    data: { parentId: lea.id },
  });
  await prisma.agent.update({
    where: { id: rui.id },
    data: { parentId: ken.id },
  });

  await prisma.task.createMany({
    data: [
      {
        title: "Finalize release checklist",
        description: "Lock the go/no-go checklist with owners.",
        status: TaskStatus.IN_PROGRESS,
        assigneeId: lea.id,
        projectId: apollo.id,
      },
      {
        title: "Refactor job heartbeat endpoint",
        description: "Add retry-safe response semantics.",
        status: TaskStatus.TODO,
        assigneeId: ken.id,
        projectId: atlas.id,
      },
      {
        title: "Ingest API docs into index",
        description: "Normalize document metadata and split long sections.",
        status: TaskStatus.REVIEW,
        assigneeId: maya.id,
        projectId: hermes.id,
      },
      {
        title: "Validate overnight cron jobs",
        description: "Ensure next_run window aligns with maintenance policy.",
        status: TaskStatus.DONE,
        assigneeId: rui.id,
        projectId: apollo.id,
      },
    ],
  });

  await prisma.memory.create({
    data: {
      title: "Postmortem: webhook latency spike",
      content: "Root cause was queue backpressure during deployment overlap.",
      tags: ["incident", "latency", "queue"],
      occurredAt: new Date("2026-03-01T09:00:00.000Z"),
    },
  });

  await prisma.memory.create({
    data: {
      title: "Decision: consolidate cron owners",
      content: "All scheduled jobs now route ownership through Ops Agent team.",
      tags: ["decision", "scheduler"],
      occurredAt: new Date("2026-03-03T06:30:00.000Z"),
    },
  });

  await prisma.memory.create({
    data: {
      title: "Customer note: docs search relevance",
      content: "Users requested more obvious matching of error code references.",
      tags: ["feedback", "docs"],
      occurredAt: new Date("2026-03-04T11:15:00.000Z"),
    },
  });

  await prisma.document.createMany({
    data: [
      {
        title: "Runbook: deployment safety",
        fileName: "deployment-safety.md",
        contentType: "text/markdown",
        description: "Preflight and rollback guidance.",
        textContent: "Steps for staging verification, canary release, and rollback.",
      },
      {
        title: "Architecture: scheduler pipeline",
        fileName: "scheduler-pipeline.txt",
        contentType: "text/plain",
        description: "How cron jobs are evaluated and dispatched.",
        textContent: "Covers cron parsing, next_run updates, and lock behavior.",
      },
      {
        title: "Knowledge base taxonomy",
        fileName: "taxonomy-v2.doc",
        contentType: "application/msword",
        description: "Tag strategy for docs and memory records.",
        textContent: "Taxonomy includes incident, policy, release, and ownership domains.",
      },
    ],
  });

  await prisma.job.createMany({
    data: [
      {
        name: "Nightly health digest",
        cronExpression: "0 1 * * *",
        nextRun: new Date("2026-03-06T01:00:00.000Z"),
        enabled: true,
      },
      {
        name: "Index compaction",
        cronExpression: "30 2 * * 1",
        nextRun: new Date("2026-03-09T02:30:00.000Z"),
        enabled: true,
      },
      {
        name: "Legacy metrics export",
        cronExpression: "*/30 * * * *",
        nextRun: new Date("2026-03-05T10:30:00.000Z"),
        enabled: false,
      },
    ],
  });

  await prisma.desk.createMany({
    data: [
      { label: "A1", x: 1, y: 1, agentId: lea.id },
      { label: "A2", x: 2, y: 1, agentId: ken.id },
      { label: "B1", x: 1, y: 2, agentId: maya.id },
      { label: "B2", x: 2, y: 2, agentId: rui.id },
      { label: "C1", x: 3, y: 3, agentId: null },
      { label: "C2", x: 4, y: 3, agentId: null },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

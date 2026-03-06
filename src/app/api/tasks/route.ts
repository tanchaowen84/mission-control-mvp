import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseBody, toApiError } from "@/lib/api";
import { taskStatuses } from "@/lib/constants";
import { proxyOpenClaw } from "@/lib/openclaw";
import { taskSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const proxied = await proxyOpenClaw({ request, path: "/tasks" });
  if (proxied) return proxied;

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const status =
    statusParam && taskStatuses.includes(statusParam as (typeof taskStatuses)[number])
      ? (statusParam as (typeof taskStatuses)[number])
      : undefined;
  const assigneeId = searchParams.get("assigneeId") ?? undefined;

  const tasks = await db.task.findMany({
    where: {
      status: status ?? undefined,
      assigneeId,
    },
    include: {
      assignee: true,
      project: true,
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  try {
    const body = parseBody(taskSchema, await request.json());
    const proxied = await proxyOpenClaw({ request, path: "/tasks", method: "POST", body });
    if (proxied) return proxied;

    const task = await db.task.create({
      data: {
        title: body.title,
        description: body.description,
        status: body.status,
        assigneeId: body.assigneeId,
        projectId: body.projectId,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      },
      include: {
        assignee: true,
        project: true,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json(apiError.body, { status: apiError.status });
  }
}

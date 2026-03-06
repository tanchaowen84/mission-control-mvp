import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseBody, toApiError } from "@/lib/api";
import { proxyOpenClaw } from "@/lib/openclaw";
import { projectSchema } from "@/lib/validators";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proxied = await proxyOpenClaw({ request, path: `/projects/${id}` });
  if (proxied) return proxied;

  const project = await db.project.findUnique({
    where: { id },
    include: {
      tasks: {
        include: {
          assignee: true,
        },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = parseBody(projectSchema.partial(), await request.json());
    const proxied = await proxyOpenClaw({ request, path: `/projects/${id}`, method: "PATCH", body });
    if (proxied) return proxied;

    const existing = await db.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const updated = await db.project.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        status: body.status,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json(apiError.body, { status: apiError.status });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proxied = await proxyOpenClaw({ request, path: `/projects/${id}`, method: "DELETE" });
  if (proxied) return proxied;

  const existing = await db.project.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  await db.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

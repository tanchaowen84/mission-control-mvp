import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseBody, toApiError } from "@/lib/api";
import { proxyOpenClaw } from "@/lib/openclaw";
import { jobSchema } from "@/lib/validators";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proxied = await proxyOpenClaw({ request, path: `/jobs/${id}` });
  if (proxied) return proxied;

  const job = await db.job.findUnique({ where: { id } });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(job);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = parseBody(jobSchema.partial(), await request.json());
    const proxied = await proxyOpenClaw({ request, path: `/jobs/${id}`, method: "PATCH", body });
    if (proxied) return proxied;

    const existing = await db.job.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const updated = await db.job.update({
      where: { id },
      data: {
        name: body.name,
        cronExpression: body.cronExpression,
        nextRun: body.nextRun ? new Date(body.nextRun) : undefined,
        enabled: body.enabled,
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
  const proxied = await proxyOpenClaw({ request, path: `/jobs/${id}`, method: "DELETE" });
  if (proxied) return proxied;

  const existing = await db.job.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  await db.job.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

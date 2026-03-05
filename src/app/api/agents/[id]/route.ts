import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseBody, toApiError } from "@/lib/api";
import { agentSchema } from "@/lib/validators";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = await db.agent.findUnique({
    where: { id },
    include: { parent: true, children: true, assignedTasks: true, desk: true },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json(agent);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = parseBody(agentSchema.partial(), await request.json());

    const existing = await db.agent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    if (body.parentId === id) {
      return NextResponse.json({ error: "Agent cannot report to itself" }, { status: 400 });
    }

    if (body.parentId) {
      const parent = await db.agent.findUnique({ where: { id: body.parentId } });
      if (!parent) {
        return NextResponse.json({ error: "Parent agent not found" }, { status: 400 });
      }
    }

    const updated = await db.agent.update({
      where: { id },
      data: {
        name: body.name,
        role: body.role,
        device: body.device,
        mission: body.mission,
        parentId: body.parentId,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json(apiError.body, { status: apiError.status });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const existing = await db.agent.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  await db.agent.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

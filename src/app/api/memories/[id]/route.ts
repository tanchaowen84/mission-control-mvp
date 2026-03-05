import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseBody, toApiError } from "@/lib/api";
import { memorySchema } from "@/lib/validators";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const memory = await db.memory.findUnique({ where: { id } });

  if (!memory) {
    return NextResponse.json({ error: "Memory not found" }, { status: 404 });
  }

  return NextResponse.json(memory);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = parseBody(memorySchema.partial(), await request.json());

    const existing = await db.memory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }

    const updated = await db.memory.update({
      where: { id },
      data: {
        title: body.title,
        content: body.content,
        tags: body.tags,
        occurredAt: body.occurredAt ? new Date(body.occurredAt) : undefined,
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

  const existing = await db.memory.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Memory not found" }, { status: 404 });
  }

  await db.memory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

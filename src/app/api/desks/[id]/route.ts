import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseBody, toApiError } from "@/lib/api";
import { deskSchema } from "@/lib/validators";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const desk = await db.desk.findUnique({
    where: { id },
    include: { agent: true },
  });

  if (!desk) {
    return NextResponse.json({ error: "Desk not found" }, { status: 404 });
  }

  return NextResponse.json(desk);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = parseBody(deskSchema.partial(), await request.json());

    const existing = await db.desk.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Desk not found" }, { status: 404 });
    }

    const updated = await db.desk.update({
      where: { id },
      data: {
        label: body.label,
        x: body.x,
        y: body.y,
        agentId: body.agentId,
      },
      include: { agent: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json(apiError.body, { status: apiError.status });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const existing = await db.desk.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Desk not found" }, { status: 404 });
  }

  await db.desk.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

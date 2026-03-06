import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseBody, toApiError } from "@/lib/api";
import { proxyOpenClaw } from "@/lib/openclaw";
import { memorySchema } from "@/lib/validators";

export async function GET(request: Request) {
  const proxied = await proxyOpenClaw({ request, path: "/memories" });
  if (proxied) return proxied;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const lowered = q?.toLowerCase();

  const memories = await db.memory.findMany({
    where: q
      ? {
          OR: [{ title: { contains: q } }, { content: { contains: q } }],
        }
      : undefined,
    orderBy: { occurredAt: "desc" },
  });

  const normalized = memories
    .map((memory) => ({
      ...memory,
      tags: Array.isArray(memory.tags)
        ? memory.tags.filter((tag): tag is string => typeof tag === "string")
        : [],
    }))
    .filter((memory) => {
      if (!q) return true;
      const joined = memory.tags.join(" ");
      return (
        memory.title.toLowerCase().includes(lowered ?? "") ||
        memory.content.toLowerCase().includes(lowered ?? "") ||
        joined.toLowerCase().includes(lowered ?? "")
      );
    });

  return NextResponse.json(normalized);
}

export async function POST(request: Request) {
  try {
    const body = parseBody(memorySchema, await request.json());
    const proxied = await proxyOpenClaw({ request, path: "/memories", method: "POST", body });
    if (proxied) return proxied;

    const memory = await db.memory.create({
      data: {
        title: body.title,
        content: body.content,
        tags: body.tags,
        occurredAt: body.occurredAt ? new Date(body.occurredAt) : new Date(),
      },
    });

    return NextResponse.json(memory, { status: 201 });
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json(apiError.body, { status: apiError.status });
  }
}

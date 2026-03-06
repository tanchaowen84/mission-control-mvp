import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseBody, toApiError } from "@/lib/api";
import { proxyOpenClaw } from "@/lib/openclaw";
import { deskSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const proxied = await proxyOpenClaw({ request, path: "/desks" });
  if (proxied) return proxied;

  const desks = await db.desk.findMany({
    include: {
      agent: true,
    },
    orderBy: [{ y: "asc" }, { x: "asc" }],
  });

  return NextResponse.json(desks);
}

export async function POST(request: Request) {
  try {
    const body = parseBody(deskSchema, await request.json());
    const proxied = await proxyOpenClaw({ request, path: "/desks", method: "POST", body });
    if (proxied) return proxied;

    const desk = await db.desk.create({
      data: {
        label: body.label,
        x: body.x,
        y: body.y,
        agentId: body.agentId,
      },
      include: { agent: true },
    });

    return NextResponse.json(desk, { status: 201 });
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json(apiError.body, { status: apiError.status });
  }
}

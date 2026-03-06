import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseBody, toApiError } from "@/lib/api";
import { proxyOpenClaw } from "@/lib/openclaw";
import { agentSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const proxied = await proxyOpenClaw({ request, path: "/agents" });
  if (proxied) return proxied;

  const agents = await db.agent.findMany({
    include: {
      parent: true,
      children: true,
      assignedTasks: true,
      desk: true,
    },
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(agents);
}

export async function POST(request: Request) {
  try {
    const body = parseBody(agentSchema, await request.json());
    const proxied = await proxyOpenClaw({ request, path: "/agents", method: "POST", body });
    if (proxied) return proxied;

    if (body.parentId) {
      const parent = await db.agent.findUnique({ where: { id: body.parentId } });
      if (!parent) {
        return NextResponse.json({ error: "Parent agent not found" }, { status: 400 });
      }
    }

    const agent = await db.agent.create({
      data: {
        name: body.name,
        role: body.role,
        device: body.device,
        mission: body.mission,
        parentId: body.parentId,
      },
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json(apiError.body, { status: apiError.status });
  }
}

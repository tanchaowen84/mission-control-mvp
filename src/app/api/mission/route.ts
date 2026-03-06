import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { missionSchema } from "@/lib/validators";
import { parseBody, toApiError } from "@/lib/api";
import { proxyOpenClaw } from "@/lib/openclaw";

async function getOrCreateMission() {
  const current = await db.mission.findFirst({ orderBy: { createdAt: "asc" } });
  if (current) return current;

  return db.mission.create({
    data: {
      statement: "Define the mission for this workspace.",
    },
  });
}

export async function GET(request: Request) {
  const proxied = await proxyOpenClaw({ request, path: "/mission" });
  if (proxied) return proxied;

  const mission = await getOrCreateMission();
  return NextResponse.json(mission);
}

export async function PUT(request: Request) {
  try {
    const body = parseBody(missionSchema, await request.json());
    const proxied = await proxyOpenClaw({ request, path: "/mission", method: "PUT", body });
    if (proxied) return proxied;

    const mission = await getOrCreateMission();

    const updated = await db.mission.update({
      where: { id: mission.id },
      data: { statement: body.statement },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json(apiError.body, { status: apiError.status });
  }
}

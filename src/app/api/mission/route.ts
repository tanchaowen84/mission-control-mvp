import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { missionSchema } from "@/lib/validators";
import { parseBody, toApiError } from "@/lib/api";

async function getOrCreateMission() {
  const current = await db.mission.findFirst({ orderBy: { createdAt: "asc" } });
  if (current) return current;

  return db.mission.create({
    data: {
      statement: "Define the mission for this workspace.",
    },
  });
}

export async function GET() {
  const mission = await getOrCreateMission();
  return NextResponse.json(mission);
}

export async function PUT(request: Request) {
  try {
    const body = parseBody(missionSchema, await request.json());
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

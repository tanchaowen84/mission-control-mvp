import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseBody, toApiError } from "@/lib/api";
import { jobSchema } from "@/lib/validators";

export async function GET() {
  const jobs = await db.job.findMany({ orderBy: { nextRun: "asc" } });
  return NextResponse.json(jobs);
}

export async function POST(request: Request) {
  try {
    const body = parseBody(jobSchema, await request.json());

    const job = await db.job.create({
      data: {
        name: body.name,
        cronExpression: body.cronExpression,
        nextRun: new Date(body.nextRun),
        enabled: body.enabled,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json(apiError.body, { status: apiError.status });
  }
}

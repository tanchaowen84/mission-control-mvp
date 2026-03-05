import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseBody, toApiError } from "@/lib/api";
import { projectSchema } from "@/lib/validators";

export async function GET() {
  const projects = await db.project.findMany({
    include: {
      tasks: {
        include: {
          assignee: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  try {
    const body = parseBody(projectSchema, await request.json());

    const project = await db.project.create({
      data: {
        name: body.name,
        description: body.description,
        status: body.status,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json(apiError.body, { status: apiError.status });
  }
}

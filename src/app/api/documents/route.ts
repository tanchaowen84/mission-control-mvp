import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseBody, toApiError } from "@/lib/api";
import { documentSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  const documents = await db.document.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q } },
            { fileName: { contains: q } },
            { description: { contains: q } },
            { textContent: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(documents);
}

export async function POST(request: Request) {
  try {
    const body = parseBody(documentSchema, await request.json());

    const document = await db.document.create({
      data: {
        title: body.title,
        fileName: body.fileName,
        contentType: body.contentType,
        description: body.description,
        textContent: body.textContent,
        sourceUrl: body.sourceUrl,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json(apiError.body, { status: apiError.status });
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseBody, toApiError } from "@/lib/api";
import { proxyOpenClaw } from "@/lib/openclaw";
import { documentSchema } from "@/lib/validators";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proxied = await proxyOpenClaw({ request, path: `/documents/${id}` });
  if (proxied) return proxied;

  const document = await db.document.findUnique({ where: { id } });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json(document);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = parseBody(documentSchema.partial(), await request.json());
    const proxied = await proxyOpenClaw({ request, path: `/documents/${id}`, method: "PATCH", body });
    if (proxied) return proxied;

    const existing = await db.document.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const updated = await db.document.update({
      where: { id },
      data: {
        title: body.title,
        fileName: body.fileName,
        contentType: body.contentType,
        description: body.description,
        textContent: body.textContent,
        sourceUrl: body.sourceUrl,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json(apiError.body, { status: apiError.status });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proxied = await proxyOpenClaw({ request, path: `/documents/${id}`, method: "DELETE" });
  if (proxied) return proxied;

  const existing = await db.document.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  await db.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "mission-control-mvp",
    timestamp: new Date().toISOString(),
  });
}

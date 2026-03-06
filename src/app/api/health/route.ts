import { NextResponse } from "next/server";
import { isOpenClawEnabled } from "@/lib/openclaw";

export async function GET() {
  const openClawEnabled = isOpenClawEnabled();

  return NextResponse.json({
    status: "ok",
    service: "mission-control-mvp",
    timestamp: new Date().toISOString(),
    integrations: {
      openclaw: {
        enabled: openClawEnabled,
        mode: openClawEnabled ? "upstream" : "local-fallback",
      },
    },
  });
}

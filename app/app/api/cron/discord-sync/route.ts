import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/api-auth";

// GET /api/cron/discord-sync
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: implementar quando Discord estiver configurado
  return NextResponse.json({ ok: true, synced: 0, message: "Discord não configurado ainda" });
}

import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/api-auth";

// Chamado pelo Vercel Cron (cloud) ou manualmente em dev
// GET /api/cron/teams-sync
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: implementar quando Teams estiver configurado
  return NextResponse.json({ ok: true, synced: 0, message: "Teams não configurado ainda" });
}

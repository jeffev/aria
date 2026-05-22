import { NextResponse } from "next/server";

// Chamado pelo Vercel Cron (cloud) ou manualmente em dev
// GET /api/cron/teams-sync
export async function GET(request: Request) {
  // Protege a rota de chamadas externas não autorizadas (cloud)
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: implementar quando Teams estiver configurado
  return NextResponse.json({ ok: true, synced: 0, message: "Teams não configurado ainda" });
}

import { NextResponse } from "next/server";

// GET /api/cron/discord-sync
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: implementar quando Discord estiver configurado
  return NextResponse.json({ ok: true, synced: 0, message: "Discord não configurado ainda" });
}

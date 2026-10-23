import { NextResponse } from "next/server";
import { IS_DEMO, purgeExpiredGuests } from "@/lib/demo";

// GET /api/cron/demo-cleanup — diário (Vercel Cron). Apaga convidados vencidos
// mesmo quando ninguém entra na demo, já que a limpeza também roda a cada login.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!IS_DEMO) return NextResponse.json({ ok: true, purged: 0 });

  const purged = await purgeExpiredGuests();
  return NextResponse.json({ ok: true, purged });
}

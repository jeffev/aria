import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/api-auth";
import { IS_DEMO, purgeExpiredGuests } from "@/lib/demo";

// GET /api/cron/demo-cleanup — diário (Vercel Cron). Apaga convidados vencidos
// mesmo quando ninguém entra na demo, já que a limpeza também roda a cada login.
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!IS_DEMO) return NextResponse.json({ ok: true, purged: 0 });

  const purged = await purgeExpiredGuests();
  return NextResponse.json({ ok: true, purged });
}

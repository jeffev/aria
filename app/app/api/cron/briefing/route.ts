import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/api-auth";

// GET /api/cron/briefing — roda às 08h nos dias úteis (Vercel Cron)
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: gerar briefing do dia com Gemini e salvar no banco
  return NextResponse.json({ ok: true, message: "Briefing não implementado ainda" });
}

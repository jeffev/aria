import { NextResponse } from "next/server";

// GET /api/cron/briefing — roda às 08h nos dias úteis (Vercel Cron)
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: gerar briefing do dia com Gemini e salvar no banco
  return NextResponse.json({ ok: true, message: "Briefing não implementado ainda" });
}

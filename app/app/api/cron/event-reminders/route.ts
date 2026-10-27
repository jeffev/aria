import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/api-auth";
import { sendDueReminders } from "@/lib/event-reminders";

// GET /api/cron/event-reminders — para quem roda sem processo contínuo
// (Vercel Pro, cron externo). No VPS o instrumentation.ts já faz isso.
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sent = await sendDueReminders();
  return NextResponse.json({ ok: true, sent });
}

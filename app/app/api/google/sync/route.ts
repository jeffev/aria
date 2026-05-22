import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchCalendarEvents, getAccessToken } from "@/lib/google-calendar";

export async function POST() {
  const setting = await prisma.setting.findUnique({ where: { key: "google_refresh_token" } });
  if (!setting) {
    return NextResponse.json({ error: "Google Calendar não conectado" }, { status: 400 });
  }

  const accessToken = await getAccessToken(setting.value);
  const googleEvents = await fetchCalendarEvents(accessToken, 14);

  let synced = 0;
  for (const gev of googleEvents) {
    const startRaw = gev.start.dateTime ?? gev.start.date;
    const endRaw = gev.end.dateTime ?? gev.end.date;
    if (!startRaw) continue;

    const allDay = !gev.start.dateTime;
    const startAt = new Date(startRaw);
    const endAt = endRaw ? new Date(endRaw) : null;

    await prisma.event.upsert({
      where: { sourceId_source: { sourceId: gev.id, source: "GOOGLE_CALENDAR" } } as never,
      update: {
        title: gev.summary ?? "(Sem título)",
        description: gev.description ?? null,
        startAt,
        endAt,
        allDay,
      },
      create: {
        title: gev.summary ?? "(Sem título)",
        description: gev.description ?? null,
        startAt,
        endAt,
        allDay,
        source: "GOOGLE_CALENDAR",
        sourceId: gev.id,
      },
    });
    synced++;
  }

  return NextResponse.json({ ok: true, synced });
}

export async function GET() {
  const setting = await prisma.setting.findUnique({ where: { key: "google_refresh_token" } });
  return NextResponse.json({ connected: !!setting });
}

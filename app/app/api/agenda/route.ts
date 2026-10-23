import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId, unauthorized } from "@/lib/api-auth";
import { isOverItemLimit, itemLimitMessage } from "@/lib/demo";
import { Event } from "@/generated/prisma/client";

type Recurrence = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

function expandEvent(event: Event, from: Date, to: Date) {
  if (event.recurrence === "NONE") {
    return event.startAt <= to && event.startAt >= from ? [event] : [];
  }

  const instances: (Event & { instanceId: string })[] = [];
  const duration = event.endAt
    ? event.endAt.getTime() - event.startAt.getTime()
    : 0;

  const rangeEnd = event.recurrenceEnd
    ? new Date(Math.min(event.recurrenceEnd.getTime(), to.getTime()))
    : to;

  let cursor = new Date(event.startAt);
  let safety = 0;

  while (cursor <= rangeEnd && safety < 500) {
    safety++;
    if (cursor >= from) {
      const endAt = event.endAt
        ? new Date(cursor.getTime() + duration)
        : null;
      instances.push({
        ...event,
        startAt: new Date(cursor),
        endAt,
        instanceId: `${event.id}_${cursor.toISOString()}`,
      });
    }

    const next = new Date(cursor);
    switch (event.recurrence as Recurrence) {
      case "DAILY":   next.setDate(next.getDate() + 1); break;
      case "WEEKLY":  next.setDate(next.getDate() + 7); break;
      case "MONTHLY": next.setMonth(next.getMonth() + 1); break;
      case "YEARLY":  next.setFullYear(next.getFullYear() + 1); break;
    }
    cursor = next;
  }

  return instances;
}

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const fromDate = from ? new Date(from) : new Date();
  const toDate = to ? new Date(to) : new Date(Date.now() + 7 * 86400000);

  const baseEvents = await prisma.event.findMany({
    where: {
      userId,
      OR: [
        { recurrence: "NONE", startAt: { gte: fromDate, lte: toDate } },
        {
          recurrence: { not: "NONE" },
          startAt: { lte: toDate },
          OR: [
            { recurrenceEnd: null },
            { recurrenceEnd: { gte: fromDate } },
          ],
        },
      ],
    },
    orderBy: { startAt: "asc" },
  });

  const expanded = baseEvents.flatMap((ev) => expandEvent(ev, fromDate, toDate));
  expanded.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  return NextResponse.json(expanded);
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();
  if (await isOverItemLimit("event", userId)) {
    return NextResponse.json({ error: itemLimitMessage() }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, startAt, endAt, allDay, recurrence, recurrenceEnd } = body;

  if (!title || !startAt) {
    return NextResponse.json({ error: "title e startAt são obrigatórios" }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: {
      userId,
      title,
      description: description ?? null,
      startAt: new Date(startAt),
      endAt: endAt ? new Date(endAt) : null,
      allDay: allDay ?? false,
      recurrence: recurrence ?? "NONE",
      recurrenceEnd: recurrenceEnd ? new Date(recurrenceEnd) : null,
      source: "MANUAL",
    },
  });

  return NextResponse.json(event, { status: 201 });
}

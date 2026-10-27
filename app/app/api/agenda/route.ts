import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId, unauthorized } from "@/lib/api-auth";
import { isOverItemLimit, itemLimitMessage } from "@/lib/demo";
import { expandEvent, occurringBetween } from "@/lib/event-recurrence";

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const fromDate = from ? new Date(from) : new Date();
  const toDate = to ? new Date(to) : new Date(Date.now() + 7 * 86400000);

  const baseEvents = await prisma.event.findMany({
    where: { userId, ...occurringBetween(fromDate, toDate) },
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

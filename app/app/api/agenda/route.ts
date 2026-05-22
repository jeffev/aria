import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Event } from "@/generated/prisma/client";

type Recurrence = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

// Gera instâncias de um evento recorrente dentro do intervalo [from, to]
function expandEvent(event: Event, from: Date, to: Date) {
  if (event.recurrence === "NONE") {
    // Evento simples: só inclui se estiver no intervalo
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

    // Avança para a próxima ocorrência
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

// GET /api/agenda?from=&to=
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const fromDate = from ? new Date(from) : new Date();
  const toDate = to ? new Date(to) : new Date(Date.now() + 7 * 86400000);

  // Busca eventos cujo startAt original está até o fim do intervalo
  // OU que são recorrentes e ainda não terminaram
  const baseEvents = await prisma.event.findMany({
    where: {
      OR: [
        // Eventos normais dentro do intervalo
        { recurrence: "NONE", startAt: { gte: fromDate, lte: toDate } },
        // Eventos recorrentes que começaram antes do fim do intervalo
        // e cuja recorrência ainda não terminou (ou não tem fim definido)
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

  // Expande cada evento e achata o resultado
  const expanded = baseEvents.flatMap((ev) => expandEvent(ev, fromDate, toDate));
  expanded.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  return NextResponse.json(expanded);
}

// POST /api/agenda
export async function POST(request: Request) {
  const body = await request.json();
  const { title, description, startAt, endAt, allDay, recurrence, recurrenceEnd } = body;

  if (!title || !startAt) {
    return NextResponse.json({ error: "title e startAt são obrigatórios" }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: {
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

import type { Event, Prisma } from "@/generated/prisma/client";

// Recorrência expandida em ocorrências. Mora aqui porque a agenda e os
// lembretes por push precisam concordar sobre quando cada ocorrência acontece.

type Recurrence = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

/** Filtro do Prisma: eventos que podem ter alguma ocorrência entre `from` e `to`. */
export function occurringBetween(from: Date, to: Date): Prisma.EventWhereInput {
  return {
    OR: [
      { recurrence: "NONE", startAt: { gte: from, lte: to } },
      {
        recurrence: { not: "NONE" },
        startAt: { lte: to },
        OR: [{ recurrenceEnd: null }, { recurrenceEnd: { gte: from } }],
      },
    ],
  };
}

export function expandEvent(event: Event, from: Date, to: Date) {
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

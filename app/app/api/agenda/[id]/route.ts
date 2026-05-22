import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { title, description, startAt, endAt, allDay, recurrence, recurrenceEnd } = body;

  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  if (existing.source !== "MANUAL") {
    return NextResponse.json({ error: "Eventos externos não podem ser editados" }, { status: 403 });
  }

  const event = await prisma.event.update({
    where: { id },
    data: {
      title: title ?? existing.title,
      description: description !== undefined ? description : existing.description,
      startAt: startAt ? new Date(startAt) : existing.startAt,
      endAt: endAt !== undefined ? (endAt ? new Date(endAt) : null) : existing.endAt,
      allDay: allDay !== undefined ? allDay : existing.allDay,
      recurrence: recurrence ?? existing.recurrence,
      recurrenceEnd: recurrenceEnd !== undefined
        ? (recurrenceEnd ? new Date(recurrenceEnd) : null)
        : existing.recurrenceEnd,
    },
  });

  return NextResponse.json(event);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  if (existing.source !== "MANUAL") {
    return NextResponse.json({ error: "Eventos externos não podem ser excluídos" }, { status: 403 });
  }

  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

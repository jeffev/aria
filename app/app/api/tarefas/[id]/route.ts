import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId, unauthorized } from "@/lib/api-auth";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();

  const { id } = await params;
  const body = await request.json();
  const { title, description, priority, dueDate, done } = body;

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
  if (existing.userId !== userId) return NextResponse.json({ error: "Proibido" }, { status: 403 });

  const task = await prisma.task.update({
    where: { id },
    data: {
      title: title ?? existing.title,
      description: description !== undefined ? description : existing.description,
      priority: priority ?? existing.priority,
      dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existing.dueDate,
      done: done !== undefined ? done : existing.done,
    },
  });

  return NextResponse.json(task);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();

  const { id } = await params;
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
  if (existing.userId !== userId) return NextResponse.json({ error: "Proibido" }, { status: 403 });

  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

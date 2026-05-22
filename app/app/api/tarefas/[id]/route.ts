import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/tarefas/:id
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { title, description, priority, dueDate, done } = body;

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });

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

// DELETE /api/tarefas/:id
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });

  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

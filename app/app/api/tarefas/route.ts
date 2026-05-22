import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tarefas?done=false&priority=HIGH
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const doneParam = searchParams.get("done");
  const priority = searchParams.get("priority") as "LOW" | "MEDIUM" | "HIGH" | null;

  const tasks = await prisma.task.findMany({
    where: {
      done: doneParam !== null ? doneParam === "true" : undefined,
      priority: priority ?? undefined,
    },
    orderBy: [{ done: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tasks);
}

// POST /api/tarefas
export async function POST(request: Request) {
  const body = await request.json();
  const { title, description, priority, dueDate } = body;

  if (!title) {
    return NextResponse.json({ error: "title é obrigatório" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title,
      description: description ?? null,
      priority: priority ?? "MEDIUM",
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  return NextResponse.json(task, { status: 201 });
}

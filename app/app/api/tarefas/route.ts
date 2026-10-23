import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId, unauthorized } from "@/lib/api-auth";
import { isOverItemLimit, itemLimitMessage } from "@/lib/demo";

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();

  const { searchParams } = new URL(request.url);
  const doneParam = searchParams.get("done");
  const priority = searchParams.get("priority") as "LOW" | "MEDIUM" | "HIGH" | null;

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      done: doneParam !== null ? doneParam === "true" : undefined,
      priority: priority ?? undefined,
    },
    orderBy: [{ done: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();
  if (await isOverItemLimit("task", userId)) {
    return NextResponse.json({ error: itemLimitMessage() }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, priority, dueDate } = body;

  if (!title) {
    return NextResponse.json({ error: "title é obrigatório" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      userId,
      title,
      description: description ?? null,
      priority: priority ?? "MEDIUM",
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  return NextResponse.json(task, { status: 201 });
}

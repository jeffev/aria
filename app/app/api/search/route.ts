import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId, unauthorized } from "@/lib/api-auth";

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ tasks: [], events: [], notes: [] });
  }

  const contains = { contains: q, mode: "insensitive" as const };

  const [tasks, events, notes] = await Promise.all([
    prisma.task.findMany({
      where: { userId, OR: [{ title: contains }, { description: contains }] },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.event.findMany({
      where: { userId, OR: [{ title: contains }, { description: contains }] },
      orderBy: { startAt: "desc" },
      take: 5,
    }),
    prisma.note.findMany({
      where: { userId, OR: [{ title: contains }, { content: contains }] },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  return NextResponse.json({ tasks, events, notes });
}

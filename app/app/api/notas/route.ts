import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId, unauthorized } from "@/lib/api-auth";
import { isOverItemLimit, itemLimitMessage } from "@/lib/demo";

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();

  const notes = await prisma.note.findMany({
    where: { userId },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });
  return NextResponse.json(notes);
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();
  if (await isOverItemLimit("note", userId)) {
    return NextResponse.json({ error: itemLimitMessage() }, { status: 403 });
  }

  const { title, content, pinned } = await request.json();
  if (!title?.trim()) {
    return NextResponse.json({ error: "title é obrigatório" }, { status: 400 });
  }

  const note = await prisma.note.create({
    data: { userId, title: title.trim(), content: content ?? "", pinned: pinned ?? false },
  });
  return NextResponse.json(note, { status: 201 });
}

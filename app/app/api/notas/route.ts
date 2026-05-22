import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const notes = await prisma.note.findMany({
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });
  return NextResponse.json(notes);
}

export async function POST(request: Request) {
  const { title, content, pinned } = await request.json();
  if (!title?.trim()) {
    return NextResponse.json({ error: "title é obrigatório" }, { status: 400 });
  }
  const note = await prisma.note.create({
    data: { title: title.trim(), content: content ?? "", pinned: pinned ?? false },
  });
  return NextResponse.json(note, { status: 201 });
}

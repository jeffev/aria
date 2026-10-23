import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId, unauthorized } from "@/lib/api-auth";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();

  const { id } = await params;
  const body = await request.json();
  const existing = await prisma.note.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Nota não encontrada" }, { status: 404 });
  if (existing.userId !== userId) return NextResponse.json({ error: "Proibido" }, { status: 403 });

  const note = await prisma.note.update({
    where: { id },
    data: {
      title: body.title ?? existing.title,
      content: body.content !== undefined ? body.content : existing.content,
      pinned: body.pinned !== undefined ? body.pinned : existing.pinned,
    },
  });
  return NextResponse.json(note);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();

  const { id } = await params;
  const existing = await prisma.note.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Nota não encontrada" }, { status: 404 });
  if (existing.userId !== userId) return NextResponse.json({ error: "Proibido" }, { status: 403 });

  await prisma.note.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

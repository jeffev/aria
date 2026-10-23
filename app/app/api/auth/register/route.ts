import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { IS_DEMO } from "@/lib/demo";

export async function POST(request: Request) {
  if (IS_DEMO) {
    return NextResponse.json(
      { error: "Cadastro desativado na demonstração. Entre como visitante." },
      { status: 403 }
    );
  }

  const { name, email, password } = await request.json();

  if (!email?.trim() || !password?.trim()) {
    return NextResponse.json(
      { error: "Email e senha são obrigatórios" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "A senha deve ter no mínimo 8 caracteres" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Este email já está cadastrado" },
      { status: 409 }
    );
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name: name?.trim() || null, email, password: hashed },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json(user, { status: 201 });
}

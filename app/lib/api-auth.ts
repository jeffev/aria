import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Retorna o userId autenticado via sessão JWT ou API key (overlay desktop).
 * A API key mapeia para o primeiro usuário cadastrado (admin/dono da instância).
 */
export async function getAuthenticatedUserId(
  request: Request
): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const key = authHeader.slice(7);
    if (key && key === process.env.ARIA_API_KEY) {
      const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
      return user?.id ?? null;
    }
  }

  const session = await auth();
  return session?.user?.id ?? null;
}

export function unauthorized() {
  return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
}

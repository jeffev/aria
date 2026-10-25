import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { IS_DEMO } from "@/lib/demo";

function sameSecret(a: string, b: string): boolean {
  const digest = (v: string) => createHash("sha256").update(v).digest();
  return timingSafeEqual(digest(a), digest(b));
}

/**
 * Retorna o userId autenticado via sessão JWT ou API key (overlay desktop).
 * A API key mapeia para o primeiro usuário cadastrado (admin/dono da instância).
 * Na demo pública ela fica desligada: o "primeiro usuário" seria um visitante qualquer.
 */
export async function getAuthenticatedUserId(
  request: Request
): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  const apiKey = process.env.ARIA_API_KEY;
  if (!IS_DEMO && apiKey && authHeader?.startsWith("Bearer ")) {
    if (sameSecret(authHeader.slice(7), apiKey)) {
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

/**
 * Rotas de cron: em produção exigem `Authorization: Bearer <CRON_SECRET>`.
 * Sem CRON_SECRET configurado ficam fechadas (antes, "Bearer undefined" passava).
 */
export function isCronAuthorized(request: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  return !!secret && sameSecret(header, `Bearer ${secret}`);
}

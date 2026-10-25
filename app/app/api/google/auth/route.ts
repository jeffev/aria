import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { GOOGLE_STATE_COOKIE, getAuthUrl, isGoogleCalendarEnabled } from "@/lib/google-calendar";
import { auth } from "@/auth";

export async function GET(request: Request) {
  if (!isGoogleCalendarEnabled()) {
    return NextResponse.json({ error: "Integração com o Google desativada" }, { status: 404 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // O state amarra o retorno do Google a este navegador: sem ele, um link de
  // callback com o código de outra pessoa ligaria a agenda dela à sua conta.
  const state = randomBytes(16).toString("hex");
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/google/callback`;
  const response = NextResponse.redirect(getAuthUrl(redirectUri, state));
  response.cookies.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/google/callback",
    maxAge: 600,
  });
  return response;
}

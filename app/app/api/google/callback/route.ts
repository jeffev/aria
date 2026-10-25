import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GOOGLE_STATE_COOKIE, exchangeCode, isGoogleCalendarEnabled } from "@/lib/google-calendar";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/secret-box";
import { auth } from "@/auth";

export async function GET(request: Request) {
  if (!isGoogleCalendarEnabled()) {
    return NextResponse.json({ error: "Integração com o Google desativada" }, { status: 404 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(GOOGLE_STATE_COOKIE)?.value;
  cookieStore.delete({ name: GOOGLE_STATE_COOKIE, path: "/api/google/callback" });
  if (!expectedState || searchParams.get("state") !== expectedState) {
    return NextResponse.redirect(`${origin}/configuracoes?google=error`);
  }

  if (error || !code) {
    return NextResponse.redirect(`${origin}/configuracoes?google=error`);
  }

  const redirectUri = `${origin}/api/google/callback`;
  const tokens = await exchangeCode(code, redirectUri);

  if (!tokens.refresh_token) {
    return NextResponse.redirect(`${origin}/configuracoes?google=no_refresh_token`);
  }

  // Refresh token dá acesso contínuo à agenda: fica cifrado como a chave do Gemini.
  const value = encryptSecret(tokens.refresh_token);
  await prisma.setting.upsert({
    where: { userId_key: { userId: session.user.id, key: "google_refresh_token" } },
    update: { value },
    create: { userId: session.user.id, key: "google_refresh_token", value },
  });

  return NextResponse.redirect(`${origin}/configuracoes?google=success`);
}

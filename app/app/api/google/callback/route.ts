import { NextResponse } from "next/server";
import { exchangeCode } from "@/lib/google-calendar";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${origin}/configuracoes?google=error`);
  }

  const redirectUri = `${origin}/api/google/callback`;
  const tokens = await exchangeCode(code, redirectUri);

  if (!tokens.refresh_token) {
    return NextResponse.redirect(`${origin}/configuracoes?google=no_refresh_token`);
  }

  await prisma.setting.upsert({
    where: { userId_key: { userId: session.user.id, key: "google_refresh_token" } },
    update: { value: tokens.refresh_token },
    create: { userId: session.user.id, key: "google_refresh_token", value: tokens.refresh_token },
  });

  return NextResponse.redirect(`${origin}/configuracoes?google=success`);
}

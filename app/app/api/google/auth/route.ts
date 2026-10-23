import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google-calendar";
import { auth } from "@/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/google/callback`;
  const url = getAuthUrl(redirectUri);
  return NextResponse.redirect(url);
}

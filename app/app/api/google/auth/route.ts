import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google-calendar";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/google/callback`;
  const url = getAuthUrl(redirectUri);
  return NextResponse.redirect(url);
}

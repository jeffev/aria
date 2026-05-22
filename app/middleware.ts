import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Allow Electron desktop overlay to call the API from any local origin
export function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const response = NextResponse.next();
  Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const config = {
  matcher: "/api/:path*",
};

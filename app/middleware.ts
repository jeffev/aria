import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

// Corpo máximo aceito nas rotas de API (notas, tarefas, chat). Evita que um
// visitante encha o banco da demo com textos de megabytes.
const MAX_BODY_BYTES = 32 * 1024;

// Com middleware próprio o NextAuth ignora o retorno do callback `authorized`
// (só redireciona sozinho quando não há função), então a checagem fica aqui.
export default auth(function middleware(req) {
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  const path = req.nextUrl.pathname;
  const isApi = path.startsWith("/api/");

  // Páginas exigem sessão. As rotas de API respondem 401 por conta própria,
  // porque também aceitam a API key do overlay desktop e o segredo do cron.
  if (!isApi && !authConfig.callbacks.authorized({ auth: req.auth, request: req })) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  const length = Number(req.headers.get("content-length") ?? 0);
  if (isApi && !path.startsWith("/api/auth") && length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Requisição grande demais" }, { status: 413 });
  }

  const response = NextResponse.next();

  if (isApi) {
    Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
  }

  return response;
});

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const config = {
  // Arquivos estáticos (ícones e logos de /public) ficam de fora: a tela de
  // login usa alguns antes de existir sessão. O manifest, o service worker e a
  // página offline também: o navegador os busca sem cookie de sessão, e um
  // redirecionamento para /login ali impede a instalação do app.
  matcher: [
    "/((?!_next/static|_next/image|manifest\\.webmanifest$|sw\\.js$|offline\\.html$|.*\\.(?:svg|ico|png|jpg|webp)$).*)",
  ],
};

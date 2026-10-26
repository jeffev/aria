import { NextResponse } from "next/server";
import { getAuthenticatedUserId, unauthorized } from "@/lib/api-auth";
import { deleteGeminiKey, demoAiStatus, hasGeminiKey, saveGeminiKey } from "@/lib/user-ai-key";

// Chaves do AI Studio começam com "AIza"; recusar outra coisa evita guardar lixo.
const GEMINI_KEY_PATTERN = /^AIza[0-9A-Za-z_-]{30,}$/;

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();
  return NextResponse.json({ configured: await hasGeminiKey(userId), demoAi: await demoAiStatus(userId) });
}

export async function PUT(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();

  const { apiKey } = await request.json();
  const key = typeof apiKey === "string" ? apiKey.trim() : "";
  if (!GEMINI_KEY_PATTERN.test(key)) {
    return NextResponse.json(
      { error: "Chave inválida. Ela começa com AIza e vem de aistudio.google.com/apikey." },
      { status: 400 }
    );
  }

  await saveGeminiKey(userId, key);
  return NextResponse.json({ configured: true });
}

export async function DELETE(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();
  await deleteGeminiKey(userId);
  return NextResponse.json({ configured: false });
}

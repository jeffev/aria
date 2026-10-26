import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/secret-box";
import { demoAiKey, demoAiRemaining, isDemoAiAvailable } from "@/lib/demo-ai-quota";

const SETTING_KEY = "gemini_api_key";

export interface ResolvedGeminiKey {
  apiKey: string;
  /** "user": chave da própria pessoa; "server": GEMINI_API_KEY fora da demo; "demo": chave emprestada com cota. */
  source: "user" | "server" | "demo";
}

/**
 * Chave do Gemini de quem pediu. Cada usuário traz a própria chave, então o
 * custo e a cota da IA são dele. Fora da demo vale a chave do servidor; na demo
 * pública há uma chave emprestada, com cota diária, para quem só quer experimentar.
 */
export async function resolveGeminiKey(userId: string): Promise<ResolvedGeminiKey | null> {
  const setting = await prisma.setting.findUnique({
    where: { userId_key: { userId, key: SETTING_KEY } },
  });
  if (setting) {
    try {
      return { apiKey: decryptSecret(setting.value), source: "user" };
    } catch {
      // AUTH_SECRET trocado ou valor corrompido: a pessoa cadastra a chave de novo.
      return null;
    }
  }
  if (process.env.DEMO_MODE === "true") {
    const borrowed = demoAiKey();
    return borrowed ? { apiKey: borrowed, source: "demo" } : null;
  }
  return process.env.GEMINI_API_KEY ? { apiKey: process.env.GEMINI_API_KEY, source: "server" } : null;
}

export async function getGeminiKey(userId: string): Promise<string | null> {
  return (await resolveGeminiKey(userId))?.apiKey ?? null;
}

export async function hasGeminiKey(userId: string): Promise<boolean> {
  const count = await prisma.setting.count({ where: { userId, key: SETTING_KEY } });
  return count > 0;
}

export async function saveGeminiKey(userId: string, apiKey: string): Promise<void> {
  const value = encryptSecret(apiKey);
  await prisma.setting.upsert({
    where: { userId_key: { userId, key: SETTING_KEY } },
    update: { value },
    create: { userId, key: SETTING_KEY, value },
  });
}

export async function deleteGeminiKey(userId: string): Promise<void> {
  await prisma.setting.deleteMany({ where: { userId, key: SETTING_KEY } });
}

export interface DemoAiStatus {
  remaining: number;
}

/** Cota de IA da demo para quem não cadastrou a própria chave; null quando não se aplica. */
export async function demoAiStatus(userId: string): Promise<DemoAiStatus | null> {
  if (!isDemoAiAvailable()) return null;
  if (await hasGeminiKey(userId)) return null;
  return { remaining: demoAiRemaining(userId) };
}

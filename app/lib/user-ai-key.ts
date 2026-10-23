import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/secret-box";

const SETTING_KEY = "gemini_api_key";

/**
 * Chave do Gemini de quem pediu. Cada usuário traz a própria chave, então o
 * custo e a cota da IA são dele; a do servidor só vale fora da demo pública.
 */
export async function getGeminiKey(userId: string): Promise<string | null> {
  const setting = await prisma.setting.findUnique({
    where: { userId_key: { userId, key: SETTING_KEY } },
  });
  if (setting) return decryptSecret(setting.value);
  if (process.env.DEMO_MODE === "true") return null;
  return process.env.GEMINI_API_KEY || null;
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

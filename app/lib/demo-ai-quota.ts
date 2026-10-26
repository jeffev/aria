// Cota da IA paga pelo servidor na demo pública: cada visitante tem um número
// de mensagens por dia, e há um teto geral por dia para o custo não fugir.
// Contadores em memória: a demo roda num único processo e as contas de
// visitante somem em 24 h, então isso basta.

import { IS_DEMO } from "@/lib/demo";

const MAX_PER_USER = Number(process.env.DEMO_AI_MAX_PER_USER ?? 15);
const MAX_PER_DAY = Number(process.env.DEMO_AI_MAX_PER_DAY ?? 300);

const perUser = new Map<string, number>();
let total = 0;
let day = todayKey();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function rollOverIfNeeded() {
  const today = todayKey();
  if (today !== day) {
    day = today;
    perUser.clear();
    total = 0;
  }
}

/** Chave do servidor que a demo empresta a quem não cadastrou a própria. */
export function demoAiKey(): string | null {
  if (!IS_DEMO) return null;
  return process.env.DEMO_GEMINI_API_KEY || null;
}

export function isDemoAiAvailable(): boolean {
  return demoAiKey() !== null;
}

/** Quantas mensagens o visitante ainda pode mandar hoje com a chave da demo. */
export function demoAiRemaining(userId: string): number {
  rollOverIfNeeded();
  const userLeft = MAX_PER_USER - (perUser.get(userId) ?? 0);
  const globalLeft = MAX_PER_DAY - total;
  return Math.max(0, Math.min(userLeft, globalLeft));
}

/** Registra uma mensagem. false quando a cota do visitante ou do dia acabou. */
export function consumeDemoAi(userId: string): boolean {
  if (demoAiRemaining(userId) <= 0) return false;
  perUser.set(userId, (perUser.get(userId) ?? 0) + 1);
  total += 1;
  return true;
}

export function demoAiExhaustedReply(): string {
  return `Você usou as ${MAX_PER_USER} mensagens gratuitas da demonstração por hoje. Para continuar, cadastre sua própria chave do Gemini em Configurações (aistudio.google.com/apikey).`;
}

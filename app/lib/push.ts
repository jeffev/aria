import webpush from "web-push";
import { prisma } from "@/lib/prisma";

// Web Push: o servidor entrega a notificação ao serviço de push do navegador
// (Google, Apple, Mozilla, Microsoft), que a leva ao aparelho mesmo com o app
// fechado. Sem as chaves VAPID o recurso fica desligado.

const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? "";
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
const SUBJECT = process.env.VAPID_SUBJECT ?? process.env.AUTH_URL ?? "https://aria.jeffersonvalandro.com.br";

export const MAX_SUBSCRIPTIONS_PER_USER = 5;

let configured = false;

export function isPushConfigured(): boolean {
  if (!PUBLIC_KEY || !PRIVATE_KEY) return false;
  if (!configured) {
    webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
    configured = true;
  }
  return true;
}

export function vapidPublicKey(): string | null {
  return isPushConfigured() ? PUBLIC_KEY : null;
}

// O endpoint vem do navegador, mas passa pelo cliente: sem esta lista, quem
// mandasse um endpoint inventado faria o servidor postar em qualquer endereço,
// inclusive na rede interna do VPS.
const PUSH_SERVICE_HOSTS = ["fcm.googleapis.com", "updates.push.services.mozilla.com"];
const PUSH_SERVICE_SUFFIXES = [".push.apple.com", ".notify.windows.com", ".push.services.mozilla.com"];

export function isPushServiceEndpoint(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.port || url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  return PUSH_SERVICE_HOSTS.includes(host) || PUSH_SERVICE_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

export interface PushPayload {
  title: string;
  body: string;
  tag: string;
  url: string;
}

interface StoredSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Envia para um aparelho. Inscrição que o serviço diz não existir mais é apagada. */
export async function sendPush(subscription: StoredSubscription, payload: PushPayload): Promise<boolean> {
  if (!isPushConfigured()) return false;
  try {
    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      JSON.stringify(payload),
      // Lembrete de reunião que chega uma hora depois não serve para nada.
      { TTL: 15 * 60, urgency: "high", timeout: 10_000 }
    );
    return true;
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) {
      console.info(`[push] inscrição expirada (${status}), removida`);
      await prisma.pushSubscription.deleteMany({ where: { id: subscription.id } });
    } else {
      console.error("[push] falha ao enviar:", status ?? (error as Error).message);
    }
    return false;
  }
}

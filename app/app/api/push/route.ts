import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId, unauthorized } from "@/lib/api-auth";
import { clientIp, isRateLimited } from "@/lib/rate-limit";
import { MAX_SUBSCRIPTIONS_PER_USER, isPushServiceEndpoint, vapidPublicKey } from "@/lib/push";

// GET    /api/push?endpoint=…  → chave pública e se este aparelho está inscrito
// POST   /api/push             → inscreve o aparelho { subscription, timezone }
// DELETE /api/push             → cancela { endpoint }

const MAX_ENDPOINT_LENGTH = 1000;
const MAX_KEY_LENGTH = 200;
const FALLBACK_TIMEZONE = "America/Sao_Paulo";

function isValidTimezone(timezone: unknown): timezone is string {
  if (typeof timezone !== "string" || timezone.length > 64) return false;
  try {
    new Intl.DateTimeFormat("pt-BR", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

function parseSubscription(body: unknown) {
  const subscription = (body as { subscription?: { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } })
    ?.subscription;
  const endpoint = subscription?.endpoint;
  const p256dh = subscription?.keys?.p256dh;
  const auth = subscription?.keys?.auth;
  if (typeof endpoint !== "string" || endpoint.length > MAX_ENDPOINT_LENGTH) return null;
  if (!isPushServiceEndpoint(endpoint)) return null;
  if (typeof p256dh !== "string" || p256dh.length > MAX_KEY_LENGTH) return null;
  if (typeof auth !== "string" || auth.length > MAX_KEY_LENGTH) return null;
  return { endpoint, p256dh, auth };
}

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();

  const endpoint = new URL(request.url).searchParams.get("endpoint");
  const subscribed = endpoint
    ? (await prisma.pushSubscription.count({ where: { userId, endpoint } })) > 0
    : false;
  return NextResponse.json({ publicKey: vapidPublicKey(), subscribed });
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();
  if (!vapidPublicKey()) {
    return NextResponse.json({ error: "Lembretes por push não estão configurados neste servidor." }, { status: 503 });
  }
  if (isRateLimited(`push:${clientIp(request)}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Muitas tentativas. Tente mais tarde." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const subscription = parseSubscription(body);
  if (!subscription) {
    return NextResponse.json({ error: "Inscrição inválida." }, { status: 400 });
  }
  const timezone = isValidTimezone(body?.timezone) ? body.timezone : FALLBACK_TIMEZONE;

  // O endpoint é único no banco: se estava com outra conta (aparelho que
  // trocou de usuário), passa para esta.
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: { userId, timezone, ...subscription },
    update: { userId, timezone, p256dh: subscription.p256dh, auth: subscription.auth },
  });

  const existing = await prisma.pushSubscription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  const surplus = existing.slice(MAX_SUBSCRIPTIONS_PER_USER).map((s) => s.id);
  if (surplus.length) await prisma.pushSubscription.deleteMany({ where: { id: { in: surplus } } });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();

  const body = await request.json().catch(() => null);
  const endpoint = body?.endpoint;
  if (typeof endpoint !== "string") {
    return NextResponse.json({ error: "Informe o endpoint." }, { status: 400 });
  }
  await prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
  return NextResponse.json({ ok: true });
}

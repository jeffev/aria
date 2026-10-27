import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId, unauthorized } from "@/lib/api-auth";
import { isRateLimited } from "@/lib/rate-limit";
import { sendPush } from "@/lib/push";

// POST /api/push/test — manda uma notificação para os aparelhos da conta, para
// a pessoa conferir que o lembrete chega com o app fechado.
export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();
  if (isRateLimited(`push-test:${userId}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Limite de testes atingido. Tente daqui a uma hora." }, { status: 429 });
  }

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subscriptions.length === 0) {
    return NextResponse.json({ error: "Nenhum aparelho inscrito." }, { status: 404 });
  }

  const results = await Promise.all(
    subscriptions.map((subscription) =>
      sendPush(subscription, {
        title: "🔔 ARIA",
        body: "Os lembretes de agenda estão funcionando neste aparelho.",
        tag: "aria-teste",
        url: "/configuracoes",
      })
    )
  );
  const delivered = results.filter(Boolean).length;
  if (delivered === 0) {
    return NextResponse.json({ error: "O serviço de push recusou o envio. Desative e ative de novo." }, { status: 502 });
  }
  return NextResponse.json({ ok: true, delivered });
}

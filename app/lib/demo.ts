import { prisma } from "@/lib/prisma";

// Demo pública: visitantes entram como convidados descartáveis e o banco
// gratuito fica limitado por usuário e por tempo de vida da conta.
export const IS_DEMO = process.env.DEMO_MODE === "true";

export const GUEST_EMAIL_DOMAIN = "visitante.aria.demo";
const GUEST_TTL_HOURS = 24;
const MAX_ITEMS_PER_KIND = 50;
const MAX_STORED_MESSAGES = 40;

export type ItemKind = "task" | "event" | "note";

export function itemLimitMessage(): string {
  return `Limite da demonstração: ${MAX_ITEMS_PER_KIND} itens de cada tipo.`;
}

export async function isOverItemLimit(kind: ItemKind, userId: string): Promise<boolean> {
  if (!IS_DEMO) return false;
  const where = { userId };
  const count =
    kind === "task"
      ? await prisma.task.count({ where })
      : kind === "event"
        ? await prisma.event.count({ where })
        : await prisma.note.count({ where });
  return count >= MAX_ITEMS_PER_KIND;
}

/** Mantém só as mensagens mais recentes do chat de cada usuário. */
export async function trimChatHistory(userId: string): Promise<void> {
  if (!IS_DEMO) return;
  const keep = await prisma.aiMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: MAX_STORED_MESSAGES,
    select: { id: true },
  });
  await prisma.aiMessage.deleteMany({
    where: { userId, id: { notIn: keep.map((m) => m.id) } },
  });
}

/** Apaga convidados com mais de GUEST_TTL_HOURS; o cascade leva os dados juntos. */
export async function purgeExpiredGuests(): Promise<number> {
  const cutoff = new Date(Date.now() - GUEST_TTL_HOURS * 3600 * 1000);
  const { count } = await prisma.user.deleteMany({
    where: { email: { endsWith: `@${GUEST_EMAIL_DOMAIN}` }, createdAt: { lt: cutoff } },
  });
  return count;
}

export async function createGuestUser() {
  await purgeExpiredGuests();
  const suffix = crypto.randomUUID().slice(0, 8);
  return prisma.user.create({
    data: { name: "Visitante", email: `visitante-${suffix}@${GUEST_EMAIL_DOMAIN}` },
  });
}

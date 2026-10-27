import { prisma } from "@/lib/prisma";
import { expandEvent, occurringBetween } from "@/lib/event-recurrence";
import { isPushConfigured, sendPush } from "@/lib/push";

// Lembrete por push 15 minutos antes de cada evento, para quem inscreveu um
// aparelho. Roda a cada minuto (instrumentation.ts) e também pela rota de cron.

export const REMINDER_MINUTES = 15;
const KEEP_SENT_DAYS = 2;
const FALLBACK_TIMEZONE = "America/Sao_Paulo";

/** Mesma tag que o aviso da aba aberta usa: o aparelho mostra um aviso só. */
export function reminderTag(eventId: string, occurrenceAt: Date): string {
  return `evento-${eventId}-${occurrenceAt.toISOString()}`;
}

function formatTime(date: Date, timeZone: string): string {
  const options = { hour: "2-digit", minute: "2-digit" } as const;
  try {
    return date.toLocaleTimeString("pt-BR", { ...options, timeZone });
  } catch {
    return date.toLocaleTimeString("pt-BR", { ...options, timeZone: FALLBACK_TIMEZONE });
  }
}

/** Registra a ocorrência como avisada. false quando outra rodada já avisou. */
async function claimReminder(userId: string, eventId: string, occurrenceAt: Date): Promise<boolean> {
  try {
    await prisma.pushReminder.create({ data: { userId, eventId, occurrenceAt } });
    return true;
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return false;
    throw error;
  }
}

export async function sendDueReminders(now = new Date()): Promise<number> {
  if (!isPushConfigured()) return 0;
  const windowEnd = new Date(now.getTime() + REMINDER_MINUTES * 60_000);

  const events = await prisma.event.findMany({
    where: {
      allDay: false,
      user: { pushSubscriptions: { some: {} } },
      ...occurringBetween(now, windowEnd),
    },
    include: { user: { select: { pushSubscriptions: true } } },
  });

  let sent = 0;
  for (const event of events) {
    for (const occurrence of expandEvent(event, now, windowEnd)) {
      if (!(await claimReminder(event.userId, event.id, occurrence.startAt))) continue;
      const minutes = Math.max(0, Math.round((occurrence.startAt.getTime() - now.getTime()) / 60_000));
      for (const subscription of event.user.pushSubscriptions) {
        const delivered = await sendPush(subscription, {
          title: `🔔 Em ${minutes} min: ${event.title}`,
          body: `Início: ${formatTime(occurrence.startAt, subscription.timezone)}`,
          tag: reminderTag(event.id, occurrence.startAt),
          url: "/agenda",
        });
        if (delivered) sent++;
      }
    }
  }

  await prisma.pushReminder.deleteMany({
    where: { sentAt: { lt: new Date(now.getTime() - KEEP_SENT_DAYS * 86_400_000) } },
  });
  return sent;
}

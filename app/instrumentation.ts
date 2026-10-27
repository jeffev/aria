// Verificador de lembretes por push, a cada minuto, dentro do próprio servidor.
// No VPS o ARIA é um processo só; e mesmo com duas cópias, a chave única de
// PushReminder impede o aviso duplicado. Onde não há processo contínuo
// (Vercel), a rota /api/cron/event-reminders faz o mesmo papel.

const CHECK_INTERVAL_MS = 60_000;

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  const { sendDueReminders } = await import("./lib/event-reminders");
  let running = false;
  setInterval(async () => {
    if (running) return;
    running = true;
    try {
      await sendDueReminders();
    } catch (error) {
      console.error("[push] verificador de lembretes falhou:", error);
    } finally {
      running = false;
    }
  }, CHECK_INTERVAL_MS).unref();
}

import { prisma } from "@/lib/prisma";
import Chat from "@/components/chat";

async function getDashboardData() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);

  const [pendingTasks, todayEvents, unreadNotifications] = await Promise.all([
    prisma.task.count({ where: { done: false } }),
    prisma.event.findMany({
      where: { startAt: { gte: todayStart, lt: todayEnd } },
      orderBy: { startAt: "asc" },
    }),
    prisma.notification.count({ where: { read: false } }),
  ]);

  return { pendingTasks, todayEvents, unreadNotifications };
}

export default async function DashboardPage() {
  const { pendingTasks, todayEvents, unreadNotifications } = await getDashboardData();

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, height: "calc(100vh - 64px)" }}>
      {/* Coluna principal */}
      <div style={{ overflowY: "auto", paddingRight: 8 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, margin: 0 }}>
            {greeting} 👋
          </h1>
          <p style={{ color: "var(--foreground-muted)", marginTop: 6, fontSize: 14 }}>
            {now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
          <StatCard label="Reuniões hoje" value={String(todayEvents.length)} icon="◷" />
          <StatCard label="Tarefas pendentes" value={String(pendingTasks)} icon="✓" accent={pendingTasks > 0} />
          <StatCard label="Notificações" value={String(unreadNotifications)} icon="◉" accent={unreadNotifications > 0} />
        </div>

        {/* Today events */}
        <Section title="Reuniões de hoje">
          {todayEvents.length === 0 ? (
            <Empty text="Nenhuma reunião hoje." />
          ) : (
            todayEvents.map((ev) => (
              <div
                key={ev.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div style={{ textAlign: "center", minWidth: 48 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                    {new Date(ev.startAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{ev.title}</p>
                  {ev.description && (
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--foreground-muted)" }}>{ev.description}</p>
                  )}
                </div>
                {ev.source === "TEAMS" && (
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--accent)" }}>Teams</span>
                )}
              </div>
            ))
          )}
        </Section>
      </div>

      {/* Chat */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>
          ARIA — Assistente
        </h2>
        <Chat />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent }: {
  label: string; value: string; icon: string; accent?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: `1px solid ${accent ? "var(--accent)" : "var(--border)"}`,
        borderRadius: 12,
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <span style={{ fontSize: 24, opacity: 0.7 }}>{icon}</span>
      <div>
        <p style={{ margin: 0, fontSize: 12, color: "var(--foreground-muted)" }}>{label}</p>
        <p style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 700, color: accent ? "var(--accent)" : "var(--foreground)" }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <h2 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600 }}>{title}</h2>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p style={{ color: "var(--foreground-muted)", fontSize: 13, margin: 0 }}>{text}</p>;
}

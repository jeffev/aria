import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Chat from "@/components/chat";

async function getDashboardData(userId: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);

  const [pendingTasks, todayEvents, unreadNotifications] = await Promise.all([
    prisma.task.count({ where: { userId, done: false } }),
    prisma.event.findMany({
      where: { userId, startAt: { gte: todayStart, lt: todayEnd } },
      orderBy: { startAt: "asc" },
    }),
    prisma.notification.count({ where: { read: false } }),
  ]);

  return { pendingTasks, todayEvents, unreadNotifications };
}

export default async function DashboardPage() {
  // Página de servidor: sem o filtro por dono, um usuário via as tarefas e
  // os eventos de todos os outros.
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const { pendingTasks, todayEvents, unreadNotifications } = await getDashboardData(userId);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="dashboard-grid">
      {/* Coluna principal */}
      <div className="dashboard-main">
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, margin: 0 }}>
            {greeting} 👋
          </h1>
          <p style={{ color: "var(--foreground-muted)", marginTop: 6, fontSize: 14 }}>
            {now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Stat cards */}
        <div className="stat-grid">
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
        className="dashboard-chat"
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
      className="stat-card"
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
      <span className="stat-icon" style={{ fontSize: 24, opacity: 0.7 }}>{icon}</span>
      <div>
        <p style={{ margin: 0, fontSize: 12, color: "var(--foreground-muted)" }}>{label}</p>
        <p className="stat-value" style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 700, color: accent ? "var(--accent)" : "var(--foreground)" }}>
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

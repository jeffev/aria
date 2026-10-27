import Sidebar from "@/components/sidebar";
import MobileNav from "@/components/mobile-nav";
import EventNotifications from "@/components/event-notifications";
import RegisterServiceWorker from "@/components/register-service-worker";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <div className="desktop-only" style={{ display: "flex" }}>
        <Sidebar />
      </div>
      <MobileNav />
      <main className="app-main">
        {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
          <p style={demoBannerStyle}>
            Demonstração: sua conta de visitante e tudo o que você criar são apagados em 24 horas.
            O chat tem um limite diário de mensagens; para usar sem limite, cadastre sua chave do Gemini em Configurações.
          </p>
        )}
        {children}
      </main>
      <EventNotifications />
      <RegisterServiceWorker />
    </div>
  );
}

const demoBannerStyle: React.CSSProperties = {
  margin: "0 0 20px", padding: "8px 12px", borderRadius: 8, fontSize: 12,
  background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground-muted)",
};

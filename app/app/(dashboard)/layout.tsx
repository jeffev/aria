import Sidebar from "@/components/sidebar";
import EventNotifications from "@/components/event-notifications";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <main style={{ flex: 1, padding: 32, overflowY: "auto", minHeight: "100vh" }}>
        {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
          <p style={demoBannerStyle}>
            Demonstração: sua conta de visitante e tudo o que você criar são apagados em 24 horas.
            Para usar o chat, cadastre sua chave do Gemini em Configurações.
          </p>
        )}
        {children}
      </main>
      <EventNotifications />
    </>
  );
}

const demoBannerStyle: React.CSSProperties = {
  margin: "0 0 20px", padding: "8px 12px", borderRadius: 8, fontSize: 12,
  background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground-muted)",
};

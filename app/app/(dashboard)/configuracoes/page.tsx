"use client";

import { useEffect, useState } from "react";

export default function ConfiguracoesPage() {
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/google/sync").then((r) => r.json()).then((d) => setGoogleConnected(d.connected));

    const params = new URLSearchParams(window.location.search);
    const status = params.get("google");
    if (status === "success") setSyncResult("Google Calendar conectado com sucesso!");
    if (status === "error") setSyncResult("Erro ao conectar. Tente novamente.");
    if (status === "no_refresh_token") setSyncResult("Erro: nenhum refresh token recebido. Tente novamente.");
  }, []);

  async function syncNow() {
    setSyncing(true);
    setSyncResult(null);
    const res = await fetch("/api/google/sync", { method: "POST" });
    const data = await res.json();
    setSyncResult(data.ok ? `Sincronizado! ${data.synced} eventos importados.` : data.error);
    setSyncing(false);
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: 26, fontWeight: 600, margin: "0 0 8px" }}>Configurações</h1>
      <p style={{ color: "var(--foreground-muted)", fontSize: 14, margin: "0 0 32px" }}>
        Integrações e preferências do ARIA
      </p>

      {/* Google Calendar */}
      <Section title="Google Calendar">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <p style={{ margin: 0, fontSize: 14 }}>
              Status:{" "}
              <span style={{ color: googleConnected ? "var(--success)" : "var(--foreground-muted)", fontWeight: 500 }}>
                {googleConnected === null ? "Verificando..." : googleConnected ? "Conectado" : "Não conectado"}
              </span>
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--foreground-muted)" }}>
              Importa eventos dos próximos 14 dias para a Agenda do ARIA.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {googleConnected && (
              <button onClick={syncNow} disabled={syncing} style={secondaryBtnStyle}>
                {syncing ? "Sincronizando..." : "Sincronizar agora"}
              </button>
            )}
            <a href="/api/google/auth" style={primaryBtnStyle}>
              {googleConnected ? "Reconectar" : "Conectar"}
            </a>
          </div>
        </div>
        {syncResult && (
          <p style={{ margin: "12px 0 0", fontSize: 13, color: syncResult.includes("sucesso") || syncResult.includes("Sincronizado") ? "var(--success)" : "var(--danger)" }}>
            {syncResult}
          </p>
        )}
      </Section>

      {/* Teams (futuro) */}
      <Section title="Microsoft Teams">
        <p style={{ margin: 0, fontSize: 14, color: "var(--foreground-muted)" }}>
          Em breve — requer aprovação do TI corporativo no Azure Active Directory.
        </p>
      </Section>

      {/* Discord (futuro) */}
      <Section title="Discord">
        <p style={{ margin: 0, fontSize: 14, color: "var(--foreground-muted)" }}>
          Em breve — configuração do bot Discord.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, marginBottom: 16 }}>
      <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>{title}</h2>
      {children}
    </div>
  );
}

const primaryBtnStyle: React.CSSProperties = {
  background: "var(--accent)", color: "#fff", border: "none",
  borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 500,
  cursor: "pointer", textDecoration: "none", display: "inline-block",
};
const secondaryBtnStyle: React.CSSProperties = {
  background: "var(--surface-2)", color: "var(--foreground)", border: "1px solid var(--border)",
  borderRadius: 7, padding: "8px 14px", fontSize: 13, cursor: "pointer",
};

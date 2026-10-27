"use client";

import { useEffect, useState } from "react";
import PushReminders from "@/components/push-reminders";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

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

      <GeminiKeySection />

      <Section title="Lembretes no celular">
        <PushReminders />
      </Section>

      {/* Google Calendar */}
      {!IS_DEMO && (
        <Section title="Google Calendar">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
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
      )}

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

function GeminiKeySection() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [demoRemaining, setDemoRemaining] = useState<number | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/configuracoes/gemini")
      .then((r) => r.json())
      .then((d) => {
        setConfigured(d.configured);
        setDemoRemaining(d.demoAi?.remaining ?? null);
      });
  }, []);

  async function save(method: "PUT" | "DELETE") {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/configuracoes/gemini", {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "PUT" ? JSON.stringify({ apiKey }) : undefined,
    });
    const data = await res.json();
    if (res.ok) {
      setConfigured(data.configured);
      setApiKey("");
      setMessage({ text: data.configured ? "Chave salva." : "Chave removida.", ok: true });
    } else {
      setMessage({ text: data.error, ok: false });
    }
    setSaving(false);
  }

  return (
    <Section title="Inteligência artificial (Gemini)">
      <p style={{ margin: "0 0 12px", fontSize: 14 }}>
        Status:{" "}
        <span style={{ color: configured ? "var(--success)" : "var(--foreground-muted)", fontWeight: 500 }}>
          {configured === null ? "Verificando..." : configured ? "Chave configurada" : demoRemaining !== null ? "Usando a chave da demonstração" : "Sem chave"}
        </span>
      </p>
      {!configured && demoRemaining !== null && (
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--foreground-muted)" }}>
          Na demonstração você pode mandar {demoRemaining} {demoRemaining === 1 ? "mensagem" : "mensagens"} hoje sem cadastrar nada.
          Com a sua chave não há limite.
        </p>
      )}
      <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--foreground-muted)" }}>
        O chat usa a sua própria chave do Gemini, guardada cifrada. Gere uma grátis em{" "}
        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
          aistudio.google.com/apikey
        </a>
        .
      </p>
      <div className="inline-form">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="AIza..."
          style={inputStyle}
        />
        <button onClick={() => save("PUT")} disabled={saving || !apiKey} style={primaryBtnStyle}>
          Salvar
        </button>
        {configured && (
          <button onClick={() => save("DELETE")} disabled={saving} style={secondaryBtnStyle}>
            Remover
          </button>
        )}
      </div>
      {message && (
        <p style={{ margin: "12px 0 0", fontSize: 13, color: message.ok ? "var(--success)" : "var(--danger)" }}>
          {message.text}
        </p>
      )}
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "clamp(16px, 4vw, 24px)", marginBottom: 16 }}>
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
const inputStyle: React.CSSProperties = {
  flex: 1, minWidth: 0, background: "var(--surface-2)", color: "var(--foreground)",
  border: "1px solid var(--border)", borderRadius: 7, padding: "8px 12px", fontSize: 13,
};

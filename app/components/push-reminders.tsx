"use client";

import { useEffect, useState } from "react";

type Status =
  | "loading"
  | "unsupported"      // navegador sem Web Push
  | "ios-not-installed" // iPhone só aceita push no app instalado
  | "unavailable"      // servidor sem chaves VAPID
  | "denied"           // a pessoa bloqueou notificações
  | "off"
  | "on";

const SW_READY_TIMEOUT_MS = 5000;

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function isIos() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches;
}

async function serviceWorker(): Promise<ServiceWorkerRegistration | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), SW_READY_TIMEOUT_MS));
  return Promise.race([navigator.serviceWorker.ready, timeout]);
}

export default function PushReminders() {
  const [status, setStatus] = useState<Status>("loading");
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    async function detect(): Promise<Status> {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported) return isIos() && !isStandalone() ? "ios-not-installed" : "unsupported";

      const registration = await serviceWorker();
      const subscription = await registration?.pushManager.getSubscription();
      const query = subscription ? `?endpoint=${encodeURIComponent(subscription.endpoint)}` : "";
      const data = await fetch(`/api/push${query}`).then((r) => r.json());
      setPublicKey(data.publicKey);

      if (!data.publicKey) return "unavailable";
      if (Notification.permission === "denied") return "denied";
      return data.subscribed ? "on" : "off";
    }
    detect().then(setStatus).catch(() => setStatus("unsupported"));
  }, []);

  async function enable() {
    if (!publicKey) return;
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const registration = await serviceWorker();
      if (!registration) throw new Error("service worker indisponível");
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));
      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "falha ao salvar");
      setStatus("on");
      setMessage({ text: "Lembretes ativados neste aparelho.", ok: true });
    } catch (error) {
      setMessage({ text: `Não foi possível ativar: ${(error as Error).message}`, ok: false });
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMessage(null);
    const registration = await serviceWorker();
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      await fetch("/api/push", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
    }
    setStatus("off");
    setMessage({ text: "Lembretes desativados neste aparelho.", ok: true });
    setBusy(false);
  }

  async function sendTest() {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/push/test", { method: "POST" });
    const data = await res.json();
    setMessage(
      res.ok
        ? { text: "Notificação de teste enviada. Pode fechar o app para conferir.", ok: true }
        : { text: data.error ?? "Falha ao enviar o teste.", ok: false }
    );
    setBusy(false);
  }

  return (
    <div>
      <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--foreground-muted)" }}>
        Avisa 15 minutos antes de cada evento da agenda, mesmo com o ARIA fechado. Vale para este aparelho;
        ative em cada um em que quiser receber.
      </p>
      <StatusText status={status} />
      {(status === "off" || status === "on") && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {status === "off" ? (
            <button onClick={enable} disabled={busy} style={primaryBtnStyle}>
              {busy ? "Ativando..." : "Ativar lembretes"}
            </button>
          ) : (
            <>
              <button onClick={sendTest} disabled={busy} style={primaryBtnStyle}>Enviar teste</button>
              <button onClick={disable} disabled={busy} style={secondaryBtnStyle}>Desativar</button>
            </>
          )}
        </div>
      )}
      {message && (
        <p style={{ margin: "12px 0 0", fontSize: 13, color: message.ok ? "var(--success)" : "var(--danger)" }}>
          {message.text}
        </p>
      )}
    </div>
  );
}

const STATUS_TEXT: Record<Status, string> = {
  loading: "Verificando...",
  unsupported: "Este navegador não recebe notificações com o app fechado.",
  "ios-not-installed":
    "No iPhone, os lembretes só funcionam com o ARIA instalado: toque em Compartilhar → “Adicionar à Tela de Início” e abra o ARIA por lá.",
  unavailable: "Lembretes por push não estão configurados neste servidor.",
  denied: "As notificações estão bloqueadas para o ARIA. Libere nas configurações do navegador ou do celular.",
  off: "Desativados neste aparelho.",
  on: "Ativados neste aparelho.",
};

function StatusText({ status }: { status: Status }) {
  const active = status === "on";
  return (
    <p style={{ margin: 0, fontSize: 14 }}>
      Status:{" "}
      <span style={{ color: active ? "var(--success)" : "var(--foreground-muted)", fontWeight: 500 }}>
        {STATUS_TEXT[status]}
      </span>
    </p>
  );
}

const primaryBtnStyle: React.CSSProperties = {
  background: "var(--accent)", color: "#fff", border: "none",
  borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer",
};
const secondaryBtnStyle: React.CSSProperties = {
  background: "var(--surface-2)", color: "var(--foreground)", border: "1px solid var(--border)",
  borderRadius: 7, padding: "8px 14px", fontSize: 13, cursor: "pointer",
};

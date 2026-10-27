"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  actions?: string[];
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

const ACTION_LABELS: Record<string, string> = {
  criar_evento: "✓ Evento criado na agenda",
  criar_tarefa: "✓ Tarefa criada",
  criar_nota: "✓ Nota criada",
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  // Mensagens restantes com a chave emprestada da demo; null quando a pessoa usa a própria chave.
  const [demoRemaining, setDemoRemaining] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    setSpeechSupported(
      typeof window !== "undefined" &&
        ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    );
    fetchHistory();
    fetch("/api/configuracoes/gemini")
      .then((r) => r.json())
      .then((d) => setDemoRemaining(d.demoAi?.remaining ?? null))
      .catch(() => {});
  }, []);

  // Rola só a lista de mensagens. `scrollIntoView` rolava a página inteira, e
  // no celular, onde o chat fica abaixo do resumo do dia, a tela abria no meio.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function fetchHistory() {
    const res = await fetch("/api/gemini");
    if (res.status === 401) {
      signOut({ callbackUrl: "/login" });
      return;
    }
    setMessages(await res.json());
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const tempUser: Message = {
      id: Date.now() + "u",
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUser]);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: trimmed,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });
    if (res.status === 401) {
      // Sessão de um visitante já apagado: recomeça do login.
      signOut({ callbackUrl: "/login" });
      return;
    }
    const data = await res.json();

    const tempAssistant: Message = {
      id: Date.now() + "a",
      role: "assistant",
      content: data.reply,
      createdAt: new Date().toISOString(),
      actions: data.actionsExecuted ?? [],
    };
    setMessages((prev) => [...prev.slice(0, -1), tempUser, tempAssistant]);
    if (data.demoAi) setDemoRemaining(data.demoAi.remaining);
    else if (res.status === 429 && demoRemaining !== null) setDemoRemaining(0);
    setLoading(false);
  }

  function startListening() {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => sendMessage(event.results[0][0].transcript);
    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 400 }}>
      {/* Messages */}
      <div ref={listRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 16 }}>
        {messages.length === 0 && !loading && (
          <div style={{ color: "var(--foreground-muted)", fontSize: 13, textAlign: "center", paddingTop: 32, lineHeight: 1.8 }}>
            Olá! Sou a ARIA.<br />
            Posso criar eventos, tarefas e notas.<br />
            <span style={{ fontSize: 11, opacity: 0.7 }}>
              Ex: "reunião amanhã às 14h" · "lembrete de tomar remédio" · "nota sobre o projeto X"
            </span>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 6, padding: "10px 14px" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: "var(--accent)", opacity: 0.6,
                  animation: `pulse 1s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {demoRemaining !== null && (
        <p style={{ margin: "0 0 8px", fontSize: 11, color: "var(--foreground-muted)" }}>
          {demoRemaining > 0
            ? `IA liberada na demonstração: ${demoRemaining} ${demoRemaining === 1 ? "mensagem restante" : "mensagens restantes"} hoje.`
            : "As mensagens gratuitas de hoje acabaram. Cadastre sua chave do Gemini em Configurações para continuar."}
        </p>
      )}

      {/* Input */}
      <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
          placeholder={listening ? "Ouvindo..." : "Criar evento, tarefa, nota ou perguntar..."}
          enterKeyHint="send"
          disabled={loading || listening}
          style={{
            flex: 1, minWidth: 0, background: "var(--surface-2)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "10px 14px", color: "var(--foreground)",
            fontSize: 13, outline: "none",
          }}
        />
        {speechSupported && (
          <button
            onClick={listening ? stopListening : startListening}
            disabled={loading}
            title={listening ? "Parar" : "Falar"}
            style={{
              background: listening ? "var(--danger)" : "var(--surface-2)",
              border: `1px solid ${listening ? "var(--danger)" : "var(--border)"}`,
              borderRadius: 8, padding: "10px 14px",
              color: listening ? "#fff" : "var(--foreground-muted)",
              cursor: "pointer", fontSize: 16, transition: "all 0.15s",
            }}
          >
            {listening ? "■" : "🎤"}
          </button>
        )}
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          style={{
            background: "var(--accent)", border: "none", borderRadius: 8,
            padding: "10px 16px", color: "#fff", fontSize: 13, fontWeight: 500,
            cursor: input.trim() && !loading ? "pointer" : "not-allowed",
            opacity: input.trim() && !loading ? 1 : 0.5,
          }}
        >
          Enviar
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const actions = message.actions ?? [];

  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
      <div style={{ maxWidth: "85%", display: "flex", flexDirection: "column", gap: 4 }}>
        {/* Action badges — aparecem acima da resposta da ARIA */}
        {!isUser && actions.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {actions.map((action, i) => (
              <span
                key={i}
                style={{
                  fontSize: 11, fontWeight: 600,
                  color: "var(--success)", background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  borderRadius: 5, padding: "2px 7px",
                }}
              >
                {ACTION_LABELS[action] ?? action}
              </span>
            ))}
          </div>
        )}

        <div
          style={{
            background: isUser ? "var(--accent)" : "var(--surface-2)",
            color: isUser ? "#fff" : "var(--foreground)",
            borderRadius: isUser ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
            padding: "10px 14px", fontSize: 13, lineHeight: 1.6,
            whiteSpace: "pre-wrap", wordBreak: "break-word",
          }}
        >
          {!isUser && (
            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: "var(--accent)", letterSpacing: 1 }}>
              ARIA
            </p>
          )}
          {message.content}
        </div>
      </div>
    </div>
  );
}

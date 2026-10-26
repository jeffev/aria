"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import GlobalSearch from "./search";
import WeatherWidget from "./weather";

const links = [
  { href: "/", label: "Dashboard", icon: "⬡" },
  { href: "/agenda", label: "Agenda", icon: "◷" },
  { href: "/tarefas", label: "Tarefas", icon: "✓" },
  { href: "/notas", label: "Notas", icon: "✎" },
  { href: "/notificacoes", label: "Notificações", icon: "◉" },
  { href: "/configuracoes", label: "Configurações", icon: "⚙" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 240,
        minHeight: "100vh",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        padding: "24px 0",
        flexShrink: 0,
      }}
    >
      <div style={{ padding: "0 16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <img src="/aria-icon.svg" alt="ARIA" style={{ height: 44, width: "auto" }} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--foreground)", letterSpacing: 1, lineHeight: 1 }}>
              ARIA
            </div>
            <div style={{ fontSize: 10, color: "var(--foreground-muted)", letterSpacing: 1, marginTop: 3 }}>
              ASSISTENTE PESSOAL
            </div>
          </div>
        </div>
        <GlobalSearch />
        <WeatherWidget />
      </div>

      <nav style={{ flex: 1 }}>
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 20px",
                color: active ? "var(--foreground)" : "var(--foreground-muted)",
                background: active ? "var(--surface-2)" : "transparent",
                borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: active ? 500 : 400,
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 15 }}>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--foreground-muted)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>ARIA v0.1.0</span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Sair da conta"
          style={{ background: "none", border: "none", color: "var(--foreground-muted)", cursor: "pointer", fontSize: 11, padding: 0 }}
        >
          Sair
        </button>
      </div>
    </aside>
  );
}

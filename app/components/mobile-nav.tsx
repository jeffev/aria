"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import GlobalSearch from "./search";

// A barra de baixo cabe cinco abas com folga para o polegar; Notificações
// fica no topo, ao lado da busca.
const tabs = [
  { href: "/", label: "Início", icon: "⬡" },
  { href: "/agenda", label: "Agenda", icon: "◷" },
  { href: "/tarefas", label: "Tarefas", icon: "✓" },
  { href: "/notas", label: "Notas", icon: "✎" },
  { href: "/configuracoes", label: "Ajustes", icon: "⚙" },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <>
      <header className="mobile-topbar">
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <img src="/aria-icon.svg" alt="" style={{ height: 30, width: "auto" }} />
          <span style={{ fontSize: 17, fontWeight: 700, color: "var(--foreground)", letterSpacing: 1 }}>ARIA</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <GlobalSearch compact />
          <Link
            href="/notificacoes"
            aria-label="Notificações"
            className="mobile-topbar-btn"
            style={{ color: pathname === "/notificacoes" ? "var(--accent)" : "var(--foreground-muted)" }}
          >
            ◉
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mobile-topbar-btn"
            style={{ fontSize: 12 }}
          >
            Sair
          </button>
        </div>
      </header>

      <nav className="mobile-tabbar" aria-label="Navegação principal">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              style={{ color: active ? "var(--accent)" : "var(--foreground-muted)" }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{tab.icon}</span>
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

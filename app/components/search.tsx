"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface SearchResults {
  tasks: { id: string; title: string; done: boolean }[];
  events: { id: string; title: string; startAt: string }[];
  notes: { id: string; title: string; content: string }[];
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults(null); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      setResults(await res.json());
      setLoading(false);
    }, 300);
  }, [query]);

  function navigate(path: string) {
    router.push(path);
    setOpen(false);
    setQuery("");
    setResults(null);
  }

  const total = results ? results.tasks.length + results.events.length + results.notes.length : 0;

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "var(--surface-2)", border: "1px solid var(--border)",
        borderRadius: 7, padding: "6px 12px", color: "var(--foreground-muted)",
        fontSize: 12, cursor: "pointer", width: "100%",
      }}
    >
      <span>🔍</span>
      <span style={{ flex: 1, textAlign: "left" }}>Pesquisar...</span>
      <kbd style={{ fontSize: 10, background: "var(--border)", borderRadius: 3, padding: "1px 4px" }}>Ctrl K</kbd>
    </button>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 80 }}>
      {/* Backdrop */}
      <div onClick={() => setOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} />

      {/* Modal */}
      <div style={{ position: "relative", width: 560, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <span>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar tarefas, eventos, notas..."
            style={{ flex: 1, background: "transparent", border: "none", fontSize: 15, color: "var(--foreground)", outline: "none" }}
          />
          {loading && <span style={{ fontSize: 11, color: "var(--foreground-muted)" }}>Buscando...</span>}
          <kbd onClick={() => setOpen(false)} style={{ fontSize: 11, color: "var(--foreground-muted)", cursor: "pointer" }}>Esc</kbd>
        </div>

        {results && (
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {total === 0 ? (
              <p style={{ padding: 20, color: "var(--foreground-muted)", fontSize: 13, textAlign: "center" }}>
                Nenhum resultado para "{query}"
              </p>
            ) : (
              <>
                <ResultGroup
                  label="Tarefas"
                  items={results.tasks.map((t) => ({ id: t.id, label: t.title, meta: t.done ? "Concluída" : "Pendente", path: "/tarefas" }))}
                  onSelect={navigate}
                />
                <ResultGroup
                  label="Eventos"
                  items={results.events.map((e) => ({ id: e.id, label: e.title, meta: new Date(e.startAt).toLocaleDateString("pt-BR"), path: "/agenda" }))}
                  onSelect={navigate}
                />
                <ResultGroup
                  label="Notas"
                  items={results.notes.map((n) => ({ id: n.id, label: n.title, meta: n.content.slice(0, 50) || "Nota vazia", path: "/notas" }))}
                  onSelect={navigate}
                />
              </>
            )}
          </div>
        )}

        {!results && (
          <p style={{ padding: 20, color: "var(--foreground-muted)", fontSize: 12, textAlign: "center" }}>
            Digite para pesquisar em tarefas, eventos e notas
          </p>
        )}
      </div>
    </div>
  );
}

function ResultGroup({ label, items, onSelect }: {
  label: string;
  items: { id: string; label: string; meta: string; path: string }[];
  onSelect: (path: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p style={{ margin: 0, padding: "8px 16px 4px", fontSize: 10, fontWeight: 700, color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: 1 }}>
        {label}
      </p>
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => onSelect(item.path)}
          style={{ padding: "10px 16px", cursor: "pointer", borderBottom: "1px solid var(--border)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>{item.label}</p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--foreground-muted)" }}>{item.meta}</p>
        </div>
      ))}
    </div>
  );
}

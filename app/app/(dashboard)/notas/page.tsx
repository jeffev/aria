"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Note {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  updatedAt: string;
}

export default function NotasPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selected, setSelected] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchNotes = useCallback(async () => {
    const res = await fetch("/api/notas");
    const data = await res.json();
    setNotes(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  async function createNote() {
    const res = await fetch("/api/notas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Nova nota", content: "" }),
    });
    const note = await res.json();
    setNotes((prev) => [note, ...prev]);
    setSelected(note);
  }

  function handleChange(field: "title" | "content", value: string) {
    if (!selected) return;
    const updated = { ...selected, [field]: value };
    setSelected(updated);
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => autoSave(updated), 800);
  }

  async function autoSave(note: Note) {
    setSaving(true);
    await fetch(`/api/notas/${note.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: note.title, content: note.content }),
    });
    setSaving(false);
  }

  async function togglePin(note: Note, e: React.MouseEvent) {
    e.stopPropagation();
    const updated = { ...note, pinned: !note.pinned };
    await fetch(`/api/notas/${note.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: updated.pinned }),
    });
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned)));
    if (selected?.id === note.id) setSelected(updated);
  }

  async function deleteNote(note: Note, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Excluir esta nota?")) return;
    await fetch(`/api/notas/${note.id}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    if (selected?.id === note.id) setSelected(null);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16, height: "calc(100vh - 64px)" }}>
      {/* Sidebar de notas */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Notas</h1>
          <button onClick={createNote} style={primaryBtnStyle}>+ Nova</button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          {loading && <p style={{ color: "var(--foreground-muted)", fontSize: 13 }}>Carregando...</p>}
          {!loading && notes.length === 0 && (
            <p style={{ color: "var(--foreground-muted)", fontSize: 13 }}>Nenhuma nota. Crie uma!</p>
          )}
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => setSelected(note)}
              style={{
                background: selected?.id === note.id ? "var(--surface-2)" : "var(--surface)",
                border: `1px solid ${selected?.id === note.id ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 8,
                padding: "10px 12px",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {note.pinned && <span style={{ fontSize: 11, color: "var(--accent)" }}>📌</span>}
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {note.title || "Sem título"}
                </p>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--foreground-muted)" }}>
                {note.content ? note.content.slice(0, 40) + (note.content.length > 40 ? "..." : "") : "Nota vazia"}
              </p>
              <div style={{ display: "flex", gap: 4, position: "absolute", top: 8, right: 8, opacity: 0 }}
                className="note-actions">
                <button onClick={(e) => togglePin(note, e)} style={iconBtnStyle} title={note.pinned ? "Desafixar" : "Fixar"}>
                  {note.pinned ? "📌" : "📍"}
                </button>
                <button onClick={(e) => deleteNote(note, e)} style={{ ...iconBtnStyle, color: "var(--danger)" }} title="Excluir">✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column" }}>
        {!selected ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--foreground-muted)", fontSize: 14 }}>
            Selecione ou crie uma nota
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <input
                value={selected.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Título da nota"
                style={{
                  flex: 1, background: "transparent", border: "none", fontSize: 20,
                  fontWeight: 600, color: "var(--foreground)", outline: "none",
                }}
              />
              <span style={{ fontSize: 11, color: "var(--foreground-muted)", marginLeft: 12 }}>
                {saving ? "Salvando..." : "Salvo"}
              </span>
            </div>
            <textarea
              value={selected.content}
              onChange={(e) => handleChange("content", e.target.value)}
              placeholder="Escreva sua nota aqui..."
              style={{
                flex: 1, background: "transparent", border: "none", resize: "none",
                color: "var(--foreground)", fontSize: 14, lineHeight: 1.7,
                outline: "none", fontFamily: "inherit",
              }}
            />
          </>
        )}
      </div>

      <style>{`
        div:hover .note-actions { opacity: 1 !important; transition: opacity 0.15s; }
      `}</style>
    </div>
  );
}

const primaryBtnStyle: React.CSSProperties = {
  background: "var(--accent)", color: "#fff", border: "none",
  borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer",
};
const iconBtnStyle: React.CSSProperties = {
  background: "transparent", border: "none", cursor: "pointer",
  padding: "2px 3px", fontSize: 12, color: "var(--foreground-muted)",
};

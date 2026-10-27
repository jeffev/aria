"use client";

import { useEffect, useState, useCallback, useRef } from "react";

type EventSource = "MANUAL" | "TEAMS";
type Recurrence = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

interface AgendaEvent {
  id: string;
  instanceId?: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  recurrence: Recurrence;
  recurrenceEnd: string | null;
  source: EventSource;
}

interface EventForm {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  recurrence: Recurrence;
  recurrenceEnd: string;
}

const EMPTY_FORM: EventForm = {
  title: "",
  description: "",
  date: "",
  startTime: "09:00",
  endTime: "10:00",
  allDay: false,
  recurrence: "NONE",
  recurrenceEnd: "",
};

const RECURRENCE_LABELS: Record<Recurrence, string> = {
  NONE: "Nunca",
  DAILY: "Diariamente",
  WEEKLY: "Semanalmente",
  MONTHLY: "Mensalmente",
  YEARLY: "Anualmente",
};

const RECURRENCE_BADGE: Record<Recurrence, string> = {
  NONE: "",
  DAILY: "Diário",
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  YEARLY: "Anual",
};

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function fmt(date: Date, opts: Intl.DateTimeFormatOptions) {
  return date.toLocaleDateString("pt-BR", opts);
}

function fmtTime(date: Date) {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function toLocalDateStr(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function AgendaPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // No celular a lista é longa e o formulário abre no topo, fora da vista de
  // quem tocou num item lá embaixo.
  useEffect(() => {
    if (showForm) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showForm, editingEvent]);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = addDays(weekStart, 6);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const from = weekStart.toISOString();
    const to = addDays(weekEnd, 1).toISOString();
    const res = await fetch(`/api/agenda?from=${from}&to=${to}`);
    const data = await res.json();
    setEvents(data);
    setLoading(false);
  }, [weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  function openNewForm(date?: Date) {
    setEditingEvent(null);
    setForm({
      ...EMPTY_FORM,
      date: toLocalDateStr(date ?? new Date()),
    });
    setShowForm(true);
  }

  function openEditForm(ev: AgendaEvent) {
    const start = new Date(ev.startAt);
    const end = ev.endAt ? new Date(ev.endAt) : null;
    setEditingEvent(ev);
    setForm({
      title: ev.title,
      description: ev.description ?? "",
      date: toLocalDateStr(start),
      startTime: fmtTime(start),
      endTime: end ? fmtTime(end) : "10:00",
      allDay: ev.allDay,
      recurrence: ev.recurrence ?? "NONE",
      recurrenceEnd: ev.recurrenceEnd ? toLocalDateStr(new Date(ev.recurrenceEnd)) : "",
    });
    setShowForm(true);
  }

  async function saveEvent() {
    if (!form.title.trim() || !form.date) return;
    setSaving(true);

    const startAt = form.allDay
      ? new Date(`${form.date}T00:00:00`).toISOString()
      : new Date(`${form.date}T${form.startTime}:00`).toISOString();

    const endAt = form.allDay
      ? null
      : new Date(`${form.date}T${form.endTime}:00`).toISOString();

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      startAt,
      endAt,
      allDay: form.allDay,
      recurrence: form.recurrence,
      recurrenceEnd: form.recurrenceEnd
        ? new Date(`${form.recurrenceEnd}T23:59:59`).toISOString()
        : null,
    };

    if (editingEvent) {
      await fetch(`/api/agenda/${editingEvent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setSaving(false);
    setShowForm(false);
    fetchEvents();
  }

  async function deleteEvent(id: string) {
    if (!confirm("Excluir este evento?")) return;
    await fetch(`/api/agenda/${id}`, { method: "DELETE" });
    fetchEvents();
  }

  const today = new Date();

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 600, margin: 0 }}>Agenda</h1>
          <p style={{ color: "var(--foreground-muted)", fontSize: 14, margin: "4px 0 0" }}>
            {fmt(weekStart, { day: "numeric", month: "long" })} —{" "}
            {fmt(weekEnd, { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="page-actions">
          <NavBtn onClick={() => setWeekStart(addDays(weekStart, -7))} label="Semana anterior">
            ←<span className="desktop-only"> Semana anterior</span>
          </NavBtn>
          <NavBtn onClick={() => setWeekStart(startOfWeek(new Date()))}>Hoje</NavBtn>
          <NavBtn onClick={() => setWeekStart(addDays(weekStart, 7))} label="Próxima semana">
            <span className="desktop-only">Próxima semana </span>→
          </NavBtn>
          <button onClick={() => openNewForm()} style={primaryBtnStyle}>
            + Novo evento
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div
          ref={formRef}
          style={{
            scrollMarginTop: 72,
            background: "var(--surface)",
            border: "1px solid var(--accent)",
            borderRadius: 12,
            padding: "clamp(16px, 4vw, 24px)",
            marginBottom: 24,
          }}
        >
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>
            {editingEvent ? "Editar evento" : "Novo evento"}
          </h3>
          <div className="form-grid-2">
            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Título *</Label>
              <Input
                value={form.title}
                onChange={(v) => setForm((f) => ({ ...f, title: v }))}
                placeholder="Ex: Reunião de planejamento"
                autoFocus
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Descrição</Label>
              <Input
                value={form.description}
                onChange={(v) => setForm((f) => ({ ...f, description: v }))}
                placeholder="Detalhes opcionais"
              />
            </div>
            <div>
              <Label>Data *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(v) => setForm((f) => ({ ...f, date: v }))}
              />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--foreground-muted)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.allDay}
                  onChange={(e) => setForm((f) => ({ ...f, allDay: e.target.checked }))}
                />
                Dia inteiro
              </label>
            </div>
            {!form.allDay && (
              <>
                <div>
                  <Label>Início</Label>
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(v) => setForm((f) => ({ ...f, startTime: v }))}
                  />
                </div>
                <div>
                  <Label>Fim</Label>
                  <Input
                    type="time"
                    value={form.endTime}
                    onChange={(v) => setForm((f) => ({ ...f, endTime: v }))}
                  />
                </div>
              </>
            )}
            <div>
              <Label>Repetição</Label>
              <select
                value={form.recurrence}
                onChange={(e) => setForm((f) => ({ ...f, recurrence: e.target.value as Recurrence, recurrenceEnd: "" }))}
                style={{
                  width: "100%",
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "8px 10px",
                  color: "var(--foreground)",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              >
                {(Object.keys(RECURRENCE_LABELS) as Recurrence[]).map((key) => (
                  <option key={key} value={key}>
                    {RECURRENCE_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
            {form.recurrence !== "NONE" && (
              <div>
                <Label>Repetir até (opcional)</Label>
                <Input
                  type="date"
                  value={form.recurrenceEnd}
                  onChange={(v) => setForm((f) => ({ ...f, recurrenceEnd: v }))}
                />
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={saveEvent} disabled={saving} style={primaryBtnStyle}>
              {saving ? "Salvando..." : editingEvent ? "Salvar alterações" : "Criar evento"}
            </button>
            <button onClick={() => setShowForm(false)} style={secondaryBtnStyle}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Week grid */}
      <div className="week-grid">
        {weekDays.map((day) => {
          const isToday = isSameDay(day, today);
          const dayEvents = events.filter((ev) => isSameDay(new Date(ev.startAt), day));

          return (
            <div
              key={day.toISOString()}
              className="week-day"
              style={{
                background: isToday ? "var(--surface-2)" : "var(--surface)",
                border: `1px solid ${isToday ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 10,
                padding: 12,
                minHeight: 140,
              }}
            >
              {/* Day header */}
              <div className="week-day-header" style={{ marginBottom: 8 }}>
                <p style={{ margin: 0, fontSize: 11, color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: 1 }}>
                  {fmt(day, { weekday: "short" })}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: isToday ? 700 : 400, color: isToday ? "var(--accent)" : "var(--foreground)" }}>
                  {day.getDate()}
                </p>
              </div>

              {/* Events */}
              <div className="week-day-events">
              {loading ? (
                <div style={{ height: 20, background: "var(--border)", borderRadius: 4, opacity: 0.5 }} />
              ) : (
                <>
                  {dayEvents.map((ev) => (
                    <EventChip
                      key={ev.instanceId ?? ev.id}
                      event={ev}
                      onEdit={() => openEditForm(ev)}
                      onDelete={() => deleteEvent(ev.id)}
                    />
                  ))}
                  <button
                    onClick={() => openNewForm(day)}
                    style={{
                      width: "100%",
                      marginTop: 4,
                      padding: "4px 0",
                      background: "transparent",
                      border: "1px dashed var(--border)",
                      borderRadius: 4,
                      color: "var(--foreground-muted)",
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    +
                  </button>
                </>
              )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventChip({
  event,
  onEdit,
  onDelete,
}: {
  event: AgendaEvent;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const start = new Date(event.startAt);
  const isTeams = event.source === "TEAMS";
  const isRecurring = event.recurrence && event.recurrence !== "NONE";

  return (
    <div
      style={{
        background: isTeams ? "rgba(99,102,241,0.15)" : "var(--surface-2)",
        border: `1px solid ${isTeams ? "var(--accent)" : "var(--border)"}`,
        borderRadius: 5,
        padding: "5px 7px",
        marginBottom: 4,
        fontSize: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontWeight: 500, lineHeight: 1.3, flex: 1 }}>{event.title}</span>
        {!isTeams && (
          <div style={{ display: "flex", gap: 4, marginLeft: 4 }}>
            <ActionBtn onClick={onEdit} label="Editar evento">✎</ActionBtn>
            <ActionBtn onClick={onDelete} label="Excluir evento">✕</ActionBtn>
          </div>
        )}
      </div>
      <p style={{ margin: "2px 0 0", color: "var(--foreground-muted)", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
        {event.allDay ? "Dia inteiro" : fmtTime(start)}
        {isTeams && <span style={{ color: "var(--accent)" }}>· Teams</span>}
        {isRecurring && (
          <span style={{
            color: "#f59e0b",
            fontSize: 10,
            fontWeight: 600,
          }}>
            ↻ {RECURRENCE_BADGE[event.recurrence]}
          </span>
        )}
      </p>
    </div>
  );
}

// ─── Small UI helpers ──────────────────────────────────────────────────────

function NavBtn({ onClick, children, label }: { onClick: () => void; children: React.ReactNode; label?: string }) {
  return (
    <button onClick={onClick} style={secondaryBtnStyle} aria-label={label} title={label}>
      {children}
    </button>
  );
}

function ActionBtn({ onClick, children, label }: { onClick: () => void; children: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="touch-target"
      style={{
        background: "transparent",
        border: "none",
        color: "var(--foreground-muted)",
        cursor: "pointer",
        padding: "0 2px",
        fontSize: 11,
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--foreground-muted)" }}>{children}</p>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      style={{
        width: "100%",
        background: "var(--background)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: "8px 10px",
        color: "var(--foreground)",
        fontSize: 13,
        outline: "none",
        boxSizing: "border-box",
      }}
    />
  );
}

const primaryBtnStyle: React.CSSProperties = {
  background: "var(--accent)",
  color: "#fff",
  border: "none",
  borderRadius: 7,
  padding: "8px 16px",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};

const secondaryBtnStyle: React.CSSProperties = {
  background: "var(--surface-2)",
  color: "var(--foreground)",
  border: "1px solid var(--border)",
  borderRadius: 7,
  padding: "8px 14px",
  fontSize: 13,
  cursor: "pointer",
};

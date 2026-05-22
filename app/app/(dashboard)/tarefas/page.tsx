"use client";

import { useEffect, useState, useCallback } from "react";

type Priority = "LOW" | "MEDIUM" | "HIGH";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  dueDate: string | null;
  done: boolean;
  createdAt: string;
}

interface TaskForm {
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
}

const EMPTY_FORM: TaskForm = { title: "", description: "", priority: "MEDIUM", dueDate: "" };

const PRIORITY_LABEL: Record<Priority, string> = { LOW: "Baixa", MEDIUM: "Média", HIGH: "Alta" };
const PRIORITY_COLOR: Record<Priority, string> = {
  LOW: "#10b981",
  MEDIUM: "#f59e0b",
  HIGH: "#ef4444",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function isOverdue(dueDate: string | null, done: boolean) {
  if (!dueDate || done) return false;
  return new Date(dueDate) < new Date();
}

export default function TarefasPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("pending");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const params = filter === "pending" ? "?done=false" : filter === "done" ? "?done=true" : "";
    const res = await fetch(`/api/tarefas${params}`);
    setTasks(await res.json());
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  function openNewForm() {
    setEditingTask(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEditForm(task: Task) {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description ?? "",
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    });
    setShowForm(true);
  }

  async function saveTask() {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
      dueDate: form.dueDate || null,
    };

    if (editingTask) {
      await fetch(`/api/tarefas/${editingTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/tarefas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setSaving(false);
    setShowForm(false);
    fetchTasks();
  }

  async function toggleDone(task: Task) {
    await fetch(`/api/tarefas/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !task.done }),
    });
    fetchTasks();
  }

  async function deleteTask(id: string) {
    if (!confirm("Excluir esta tarefa?")) return;
    await fetch(`/api/tarefas/${id}`, { method: "DELETE" });
    fetchTasks();
  }

  const pending = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 600, margin: 0 }}>Tarefas</h1>
          <p style={{ color: "var(--foreground-muted)", fontSize: 14, margin: "4px 0 0" }}>
            {pending.length} pendente{pending.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={openNewForm} style={primaryBtnStyle}>+ Nova tarefa</button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid var(--border)", paddingBottom: 1 }}>
        {(["pending", "all", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: filter === f ? "2px solid var(--accent)" : "2px solid transparent",
              color: filter === f ? "var(--foreground)" : "var(--foreground-muted)",
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: filter === f ? 500 : 400,
              cursor: "pointer",
              marginBottom: -1,
            }}
          >
            {f === "pending" ? "Pendentes" : f === "done" ? "Concluídas" : "Todas"}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--accent)", borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>
            {editingTask ? "Editar tarefa" : "Nova tarefa"}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Título *</Label>
              <Input value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="Ex: Preparar relatório" autoFocus />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Descrição</Label>
              <Input value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} placeholder="Detalhes opcionais" />
            </div>
            <div>
              <Label>Prioridade</Label>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Priority }))}
                style={{ ...inputStyle, width: "100%" }}
              >
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
              </select>
            </div>
            <div>
              <Label>Prazo</Label>
              <Input type="date" value={form.dueDate} onChange={(v) => setForm((f) => ({ ...f, dueDate: v }))} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={saveTask} disabled={saving} style={primaryBtnStyle}>
              {saving ? "Salvando..." : editingTask ? "Salvar alterações" : "Criar tarefa"}
            </button>
            <button onClick={() => setShowForm(false)} style={secondaryBtnStyle}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Task list */}
      {loading ? (
        <div style={{ color: "var(--foreground-muted)", fontSize: 14 }}>Carregando...</div>
      ) : tasks.length === 0 ? (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 40, textAlign: "center", color: "var(--foreground-muted)", fontSize: 14 }}>
          {filter === "done" ? "Nenhuma tarefa concluída." : "Nenhuma tarefa pendente. Crie uma acima."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={() => toggleDone(task)}
              onEdit={() => openEditForm(task)}
              onDelete={() => deleteTask(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, onToggle, onEdit, onDelete }: {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const overdue = isOverdue(task.dueDate, task.done);

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity: task.done ? 0.6 : 1,
        transition: "opacity 0.15s",
      }}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        style={{
          width: 20,
          height: 20,
          borderRadius: 5,
          border: `2px solid ${task.done ? "var(--success)" : "var(--border)"}`,
          background: task.done ? "var(--success)" : "transparent",
          cursor: "pointer",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: 12,
        }}
      >
        {task.done ? "✓" : ""}
      </button>

      {/* Priority dot */}
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: PRIORITY_COLOR[task.priority], flexShrink: 0 }} />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 500, textDecoration: task.done ? "line-through" : "none" }}>
          {task.title}
        </p>
        {task.description && (
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--foreground-muted)" }}>{task.description}</p>
        )}
      </div>

      {/* Meta */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: "var(--foreground-muted)" }}>
          {PRIORITY_LABEL[task.priority]}
        </span>
        {task.dueDate && (
          <span style={{ fontSize: 11, color: overdue ? "var(--danger)" : "var(--foreground-muted)", fontWeight: overdue ? 600 : 400 }}>
            {overdue ? "⚠ " : ""}{fmtDate(task.dueDate)}
          </span>
        )}
        {!task.done && (
          <button onClick={onEdit} style={iconBtnStyle} title="Editar">✎</button>
        )}
        <button onClick={onDelete} style={{ ...iconBtnStyle, color: "var(--danger)" }} title="Excluir">✕</button>
      </div>
    </div>
  );
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--foreground-muted)" }}>{children}</p>;
}

function Input({ value, onChange, placeholder, type = "text", autoFocus }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; autoFocus?: boolean;
}) {
  return (
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} autoFocus={autoFocus} style={inputStyle}
    />
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--background)", border: "1px solid var(--border)",
  borderRadius: 6, padding: "8px 10px", color: "var(--foreground)", fontSize: 13,
  outline: "none", boxSizing: "border-box",
};

const primaryBtnStyle: React.CSSProperties = {
  background: "var(--accent)", color: "#fff", border: "none",
  borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer",
};

const secondaryBtnStyle: React.CSSProperties = {
  background: "var(--surface-2)", color: "var(--foreground)", border: "1px solid var(--border)",
  borderRadius: 7, padding: "8px 14px", fontSize: 13, cursor: "pointer",
};

const iconBtnStyle: React.CSSProperties = {
  background: "transparent", border: "none", color: "var(--foreground-muted)",
  cursor: "pointer", padding: "2px 4px", fontSize: 13,
};

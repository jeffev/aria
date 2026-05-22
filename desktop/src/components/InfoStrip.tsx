import { useEffect, useState } from 'react'

interface AgendaEvent { id: string; instanceId?: string; title: string; startAt: string; allDay: boolean }
interface Task        { id: string; title: string; priority: 'LOW' | 'MEDIUM' | 'HIGH'; done: boolean }

interface Props { apiBase: string; refreshKey?: number }

const PRIORITY_COLOR = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#6b7280' }

export default function InfoStrip({ apiBase, refreshKey = 0 }: Props) {
  const [now, setNow]           = useState(new Date())
  const [events, setEvents]     = useState<AgendaEvent[]>([])
  const [tasks, setTasks]       = useState<Task[]>([])
  const [weather, setWeather]   = useState<string | null>(null)
  const [showDetail, setDetail] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  // Today's events — re-fetches when ARIA creates something
  useEffect(() => {
    const d    = new Date()
    const from = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString()
    const to   = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString()
    fetch(`${apiBase}/api/agenda?from=${from}&to=${to}`)
      .then(r => r.json())
      .then((data: AgendaEvent[]) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [apiBase, refreshKey])

  // Pending tasks — re-fetches when ARIA creates something
  useEffect(() => {
    fetch(`${apiBase}/api/tarefas`)
      .then(r => r.json())
      .then((data: Task[]) => setTasks(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [apiBase, refreshKey])

  // Weather (Open-Meteo, free, no key)
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weathercode`)
        .then(r => r.json())
        .then(d => {
          const temp = Math.round(d.current.temperature_2m)
          const code = d.current.weathercode as number
          const icon = code <= 1 ? '☀️' : code <= 3 ? '⛅' : code <= 67 ? '🌧️' : '❄️'
          setWeather(`${icon} ${temp}°C`)
        })
        .catch(() => {})
    })
  }, [])

  const timeStr     = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const dateStr     = now.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
  const nextEvent   = events[0] ?? null
  const pendingTasks = tasks.filter(t => !t.done)
  const taskCount   = pendingTasks.length

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{
      borderBottom: '1px solid rgba(139,92,246,0.12)',
      flexShrink:   0,
    }}>
      {/* ── Row principal ── */}
      <div style={{ padding: '8px 14px' }}>
        {/* Data · hora · clima */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {dateStr} · <strong style={{ color: 'var(--text)', fontWeight: 500 }}>{timeStr}</strong>
          </span>
          {weather && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{weather}</span>}
        </div>

        {/* Próximo evento + badge de tarefas */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 5, gap: 8 }}>
          {nextEvent ? (
            <p style={{
              flex: 1, margin: 0, fontSize: 11,
              color: 'var(--accent-blue)',
              overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            }}>
              ▶ {nextEvent.allDay ? 'Hoje' : fmtTime(nextEvent.startAt)} · {nextEvent.title}
            </p>
          ) : (
            <p style={{ flex: 1, margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
              Sem eventos hoje
            </p>
          )}

          {/* Badge clicável — abre/fecha a lista detalhada */}
          <button
            onClick={() => setDetail(v => !v)}
            title={showDetail ? 'Fechar resumo' : 'Ver tarefas e eventos'}
            style={{
              fontSize:     10,
              fontWeight:   600,
              color:        taskCount > 0 ? '#f59e0b' : 'var(--success)',
              background:   taskCount > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
              border:       `1px solid ${taskCount > 0 ? 'rgba(245,158,11,0.35)' : 'rgba(16,185,129,0.35)'}`,
              borderRadius: 4,
              padding:      '2px 7px',
              cursor:       'pointer',
              flexShrink:   0,
              whiteSpace:   'nowrap',
              transition:   'opacity 0.15s',
            }}
          >
            {taskCount > 0 ? `${taskCount} tarefa${taskCount > 1 ? 's' : ''} ${showDetail ? '▴' : '▾'}` : `✓ em dia ${showDetail ? '▴' : '▾'}`}
          </button>
        </div>
      </div>

      {/* ── Detalhe expansível ── */}
      {showDetail && (
        <div style={{
          maxHeight:    180,
          overflowY:    'auto',
          padding:      '0 14px 10px',
          borderTop:    '1px solid rgba(139,92,246,0.08)',
        }}>
          {/* Tarefas pendentes */}
          {pendingTasks.length > 0 && (
            <section style={{ marginTop: 8 }}>
              <p style={sectionLabel}>Tarefas pendentes</p>
              {pendingTasks.map(t => (
                <div key={t.id} style={rowStyle}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 10, marginRight: 5 }}>○</span>
                  <span style={{ flex: 1, fontSize: 11, color: 'var(--text)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {t.title}
                  </span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, marginLeft: 6, flexShrink: 0,
                    color: PRIORITY_COLOR[t.priority],
                  }}>
                    {t.priority}
                  </span>
                </div>
              ))}
            </section>
          )}

          {/* Eventos de hoje */}
          {events.length > 0 && (
            <section style={{ marginTop: pendingTasks.length > 0 ? 10 : 8 }}>
              <p style={sectionLabel}>Eventos de hoje</p>
              {events.map(ev => (
                <div key={ev.instanceId ?? ev.id} style={rowStyle}>
                  <span style={{ fontSize: 10, color: 'var(--accent-blue)', flexShrink: 0, marginRight: 6 }}>
                    {ev.allDay ? 'dia int.' : fmtTime(ev.startAt)}
                  </span>
                  <span style={{ flex: 1, fontSize: 11, color: 'var(--text)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {ev.title}
                  </span>
                </div>
              ))}
            </section>
          )}

          {pendingTasks.length === 0 && events.length === 0 && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
              Tudo limpo por hoje ✓
            </p>
          )}
        </div>
      )}
    </div>
  )
}

const sectionLabel: React.CSSProperties = {
  margin:        '0 0 4px',
  fontSize:      9,
  fontWeight:    700,
  color:         'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: 1,
}

const rowStyle: React.CSSProperties = {
  display:    'flex',
  alignItems: 'center',
  padding:    '3px 0',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
}

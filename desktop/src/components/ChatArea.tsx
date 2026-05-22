import { useEffect, useRef } from 'react'
import type { Message } from '../App'

const ACTION_LABELS: Record<string, string> = {
  criar_evento: '✓ Evento criado',
  criar_tarefa: '✓ Tarefa criada',
  criar_nota:   '✓ Nota criada',
}

interface Props {
  messages: Message[]
  loading:  boolean
}

export default function ChatArea({ messages, loading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <div style={{
      flex:           1,
      overflowY:      'auto',
      padding:        '10px 12px 6px',
      display:        'flex',
      flexDirection:  'column',
    }}>
      {messages.length === 0 && !loading && (
        <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: '20px 8px', lineHeight: 1.8 }}>
          Olá! Sou a ARIA.<br />Escreva ou fale comigo.
        </p>
      )}

      {messages.map((msg) => (
        <div key={msg.id} style={{
          display:       'flex',
          flexDirection: 'column',
          alignItems:    msg.role === 'user' ? 'flex-end' : 'flex-start',
          marginBottom:  8,
          gap:           3,
        }}>
          {/* Action badges (above ARIA bubble) */}
          {msg.role === 'assistant' && (msg.actions ?? []).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {(msg.actions ?? []).map((a, i) => (
                <span key={i} style={{
                  fontSize:   10,
                  fontWeight: 600,
                  color:      'var(--success)',
                  background: 'rgba(16,185,129,0.1)',
                  border:     '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 4,
                  padding:    '1px 6px',
                }}>
                  {ACTION_LABELS[a] ?? a}
                </span>
              ))}
            </div>
          )}

          <div style={msg.role === 'user' ? userBubble : ariaBubble}>
            {msg.role === 'assistant' && (
              <p style={{ margin: '0 0 2px', fontSize: 9, fontWeight: 700, color: 'var(--accent-blue)', letterSpacing: 1 }}>ARIA</p>
            )}
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {msg.content}
            </p>
          </div>
        </div>
      ))}

      {loading && (
        <div style={{ display: 'flex', gap: 5, padding: '4px 8px', alignItems: 'center' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--accent)', opacity: 0.7,
              animation: `dot 1s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      )}

      <div ref={bottomRef} />

      <style>{`
        @keyframes dot { 0%,100%{transform:scale(1);opacity:.4} 50%{transform:scale(1.5);opacity:1} }
      `}</style>
    </div>
  )
}

const ariaBubble: React.CSSProperties = {
  maxWidth:     '88%',
  background:   'rgba(255,255,255,0.05)',
  border:       '1px solid rgba(139,92,246,0.2)',
  borderRadius: '10px 10px 10px 3px',
  padding:      '7px 10px',
  color:        'var(--text)',
}

const userBubble: React.CSSProperties = {
  maxWidth:     '88%',
  background:   'rgba(139,92,246,0.28)',
  border:       '1px solid rgba(139,92,246,0.4)',
  borderRadius: '10px 10px 3px 10px',
  padding:      '7px 10px',
  color:        'var(--text)',
}

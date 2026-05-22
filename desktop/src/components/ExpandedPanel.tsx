import { useState } from 'react'
import ariaIcon from '../assets/aria-icon.svg'
import ChatArea from './ChatArea'
import InfoStrip from './InfoStrip'
import VoiceButton from './VoiceButton'
import type { Message } from '../App'

interface Props {
  messages:          Message[]
  loading:           boolean
  listening:         boolean
  onListeningChange: (v: boolean) => void
  onSend:            (text: string) => void
  onCollapse:        () => void
  apiBase:           string
  refreshKey:        number
}

export default function ExpandedPanel({
  messages, loading, listening, onListeningChange, onSend, onCollapse, apiBase, refreshKey,
}: Props) {
  const [input, setInput] = useState('')

  function submit() {
    if (!input.trim()) return
    onSend(input)
    setInput('')
  }

  const placeholder = listening ? 'Ouvindo...' : loading ? 'Processando...' : 'Escreva ou fale...'

  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      width:          '100%',
      height:         '100%',
      background:     'var(--bg)',
      border:         '1px solid var(--border)',
      borderRadius:   16,
      boxShadow:      '0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.1)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      overflow:       'hidden',
    }}>

      {/* ── Header (drag region) ── */}
      <div
        className="drag"
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          8,
          padding:      '0 12px',
          height:       64,
          borderBottom: '1px solid rgba(139,92,246,0.15)',
          flexShrink:   0,
        }}
      >
        {/* Logo pulsa quando ouve / processa */}
        <button onClick={onCollapse} title="Minimizar" style={iconBtnStyle}>
          <img
            src={ariaIcon}
            alt="ARIA"
            style={{
              height:    36,
              width:     36,
              animation: listening
                ? 'aria-pulse 1.2s ease-in-out infinite'
                : loading
                ? 'aria-breathe 1.8s ease-in-out infinite'
                : undefined,
            }}
          />
        </button>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && submit()}
          placeholder={placeholder}
          disabled={loading || listening}
          style={{
            flex:       1,
            background: 'transparent',
            border:     'none',
            outline:    'none',
            color:      'var(--text)',
            fontSize:   13,
            minWidth:   0,
          }}
        />

        <VoiceButton
          listening={listening}
          onListeningChange={onListeningChange}
          onSend={(t) => onSend(t)}
          disabled={loading}
        />

        {/* Send button */}
        <button
          onClick={submit}
          disabled={!input.trim() || loading}
          title="Enviar"
          style={{
            width:          30,
            height:         30,
            borderRadius:   '50%',
            border:         'none',
            background:     input.trim() && !loading ? 'var(--accent)' : 'rgba(139,92,246,0.2)',
            color:          '#fff',
            fontSize:       14,
            cursor:         input.trim() && !loading ? 'pointer' : 'default',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexShrink:     0,
            transition:     'background 0.2s',
          }}
        >
          →
        </button>

        {/* Collapse */}
        <button onClick={onCollapse} title="Minimizar" style={closeBtnStyle}>╌</button>
      </div>

      {/* ── Info strip ── */}
      <InfoStrip apiBase={apiBase} refreshKey={refreshKey} />

      {/* ── Chat ── */}
      <ChatArea messages={messages} loading={loading} />

      <style>{`
        @keyframes aria-pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.55;transform:scale(1.12)} }
        @keyframes aria-breathe { 0%,100%{opacity:1} 50%{opacity:.45} }
      `}</style>
    </div>
  )
}

const iconBtnStyle: React.CSSProperties = {
  background: 'none',
  border:     'none',
  cursor:     'pointer',
  padding:    0,
  display:    'flex',
  alignItems: 'center',
  flexShrink: 0,
}

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border:     'none',
  color:      'var(--text-muted)',
  cursor:     'pointer',
  fontSize:   18,
  lineHeight: 1,
  padding:    '0 2px',
  flexShrink: 0,
}

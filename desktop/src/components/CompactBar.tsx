import { useState } from 'react'
import ariaIcon from '../assets/aria-icon.svg'
import VoiceButton from './VoiceButton'

interface Props {
  loading:           boolean
  listening:         boolean
  onListeningChange: (v: boolean) => void
  onSend:            (text: string) => void
  onExpand:          () => void
}

export default function CompactBar({ loading, listening, onListeningChange, onSend, onExpand }: Props) {
  const [input, setInput] = useState('')

  function submit() {
    if (!input.trim()) return
    onSend(input)
    setInput('')
  }

  const placeholder = listening ? 'Ouvindo...' : loading ? 'Processando...' : 'Falar com ARIA...'

  return (
    <div
      className="drag"
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            8,
        width:          '100%',
        height:         '100%',
        padding:        '0 12px',
        background:     'var(--bg)',
        border:         '1px solid var(--border)',
        borderRadius:   20,
        boxShadow:      '0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.08)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      {/* Logo – click to expand */}
      <button onClick={onExpand} title="Expandir" style={iconBtnStyle}>
        <img
          src={ariaIcon}
          alt="ARIA"
          style={{
            height:    38,
            width:     38,
            animation: listening
              ? 'aria-pulse 1.2s ease-in-out infinite'
              : loading
              ? 'aria-breathe 1.8s ease-in-out infinite'
              : undefined,
          }}
        />
      </button>

      {/* Input */}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        onFocus={onExpand}
        placeholder={placeholder}
        disabled={loading || listening}
        style={{
          flex:        1,
          background:  'transparent',
          border:      'none',
          outline:     'none',
          color:       'var(--text)',
          fontSize:    13,
          minWidth:    0,
        }}
      />

      <VoiceButton
        listening={listening}
        onListeningChange={onListeningChange}
        onSend={(t) => { onSend(t) }}
        disabled={loading}
      />

      <style>{`
        @keyframes aria-pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.55;transform:scale(1.12)} }
        @keyframes aria-breathe { 0%,100%{opacity:1} 50%{opacity:.45} }
      `}</style>
    </div>
  )
}

const iconBtnStyle: React.CSSProperties = {
  background:  'none',
  border:      'none',
  cursor:      'pointer',
  padding:     0,
  display:     'flex',
  alignItems:  'center',
  flexShrink:  0,
}

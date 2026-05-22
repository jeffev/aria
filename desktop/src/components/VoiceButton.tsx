import { useRef } from 'react'

interface Props {
  listening:         boolean
  onListeningChange: (v: boolean) => void
  onSend:            (text: string) => void
  disabled?:         boolean
}

export default function VoiceButton({ listening, onListeningChange, onSend, disabled }: Props) {
  const recogRef = useRef<SpeechRecognition | null>(null)
  const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
  if (!SR) return null

  function toggle() {
    if (listening) {
      recogRef.current?.stop()
      onListeningChange(false)
      return
    }
    const r = new SR()
    r.lang = 'pt-BR'
    r.interimResults = false
    r.maxAlternatives = 1
    r.onstart  = () => onListeningChange(true)
    r.onend    = () => onListeningChange(false)
    r.onerror  = () => onListeningChange(false)
    r.onresult = (e) => onSend(e.results[0][0].transcript)
    recogRef.current = r
    r.start()
  }

  return (
    <button
      onClick={toggle}
      disabled={disabled}
      title={listening ? 'Parar' : 'Falar (pt-BR)'}
      style={{
        width:          34,
        height:         34,
        borderRadius:   '50%',
        border:         `1.5px solid ${listening ? 'var(--accent)' : 'rgba(139,92,246,0.35)'}`,
        background:     listening ? 'rgba(139,92,246,0.22)' : 'transparent',
        color:          listening ? 'var(--accent)' : 'var(--text-muted)',
        fontSize:       15,
        cursor:         'pointer',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexShrink:     0,
        transition:     'all 0.2s',
      }}
    >
      {listening ? '■' : '🎤'}
    </button>
  )
}

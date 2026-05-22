import { useState } from 'react'
import CompactBar from './components/CompactBar'
import ExpandedPanel from './components/ExpandedPanel'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  actions?: string[]
}

const API = 'http://localhost:3000'

export default function App() {
  const [expanded, setExpanded]   = useState(false)
  const [messages, setMessages]   = useState<Message[]>([])
  const [loading, setLoading]     = useState(false)
  const [listening, setListening] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  function expand() {
    setExpanded(true)
    window.electronAPI?.setExpanded(true)
  }

  function collapse() {
    setExpanded(false)
    window.electronAPI?.setExpanded(false)
  }

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    // Auto-expand so the user can see the response
    if (!expanded) expand()

    setMessages(prev => [...prev, { id: Date.now() + 'u', role: 'user', content: trimmed }])
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        id:      Date.now() + 'a',
        role:    'assistant',
        content: data.reply,
        actions: data.actionsExecuted ?? [],
      }])
      if ((data.actionsExecuted ?? []).length > 0) {
        setRefreshKey(k => k + 1)
      }
    } catch {
      setMessages(prev => [...prev, {
        id:      Date.now() + 'e',
        role:    'assistant',
        content: 'Erro ao conectar. O servidor está rodando em localhost:3000?',
      }])
    } finally {
      setLoading(false)
    }
  }

  const sharedProps = { loading, listening, onListeningChange: setListening, onSend: send }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {/* Keep both mounted to preserve messages; show/hide via CSS */}
      <div style={{ display: expanded ? 'none' : 'flex', height: '100%' }}>
        <CompactBar {...sharedProps} onExpand={expand} />
      </div>
      <div style={{ display: expanded ? 'flex' : 'none', height: '100%' }}>
        <ExpandedPanel {...sharedProps} messages={messages} onCollapse={collapse} apiBase={API} refreshKey={refreshKey} />
      </div>
    </div>
  )
}

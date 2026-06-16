import { useState } from 'react'
import { Sparkles, RefreshCw, X } from 'lucide-react'
import { getTaskSuggestions } from '../../lib/ai'

export default function AISuggestPanel({ tasks, config, onAdd, onDismiss }) {
  const [suggestions, setSuggestions] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [added, setAdded] = useState(new Set())

  const load = async () => {
    setLoading(true)
    setError(null)
    setAdded(new Set())
    try {
      const data = await getTaskSuggestions(tasks, config.tags)
      setSuggestions(data.suggestions)
    } catch {
      setError('Could not load suggestions. Check your API key.')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (s, i) => {
    await onAdd({
      title: s.title,
      status: 'todo',
      tag: s.tag,
      assignee_id: '',
      priority: s.priority || '',
      due_date: '',
      notes: 'AI suggested',
    })
    setAdded(prev => new Set([...prev, i]))
  }

  const getTag = (id) => config.tags.find(t => t.id === id)

  return (
    <div className="ai-panel">
      <div className="ai-panel-hdr">
        <Sparkles size={13} color="var(--accent)" />
        <span className="ai-panel-title">AI task suggestions</span>
        <span className="ai-badge">Claude</span>
        <button className="icon-btn" onClick={load} disabled={loading} aria-label="Refresh" style={{ marginLeft: 'auto' }}><RefreshCw size={12} /></button>
        <button className="icon-btn" onClick={onDismiss} aria-label="Dismiss"><X size={12} /></button>
      </div>

      {!suggestions && !loading && !error && (
        <button className="btn btn-ghost btn-sm" onClick={load} style={{ marginTop: 4 }}>
          <Sparkles size={11} /> Generate suggestions
        </button>
      )}

      {loading && (
        <div className="ai-loading">
          <span className="spinner" />
          Generating suggestions…
        </div>
      )}

      {error && <p className="ai-error">{error}</p>}

      {suggestions && !loading && (
        <div className="ai-cards">
          {suggestions.map((s, i) => {
            const tag = getTag(s.tag)
            const isAdded = added.has(i)
            return (
              <div key={i} className={`ai-card${isAdded ? ' ai-card-added' : ''}`} onClick={() => !isAdded && handleAdd(s, i)}>
                <div className="ai-card-title">{s.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  {tag && <span className="ctag" style={{ background: tag.bg, color: tag.text, fontSize: 9 }}>{tag.label}</span>}
                  {isAdded && <span style={{ fontSize: 9, color: '#1A6B42' }}>✓ Added</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

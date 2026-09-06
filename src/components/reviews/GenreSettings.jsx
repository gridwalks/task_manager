import { useState } from 'react'
import { X, Trash2, Plus } from 'lucide-react'

export default function GenreSettings({ genres, onSave, onClose }) {
  const [list, setList] = useState([...genres])
  const [newGenre, setNewGenre] = useState('')
  const [saving, setSaving] = useState(false)

  const updateAt = (i, value) => setList(l => l.map((g, idx) => idx === i ? value : g))
  const removeAt = (i) => setList(l => l.filter((_, idx) => idx !== i))
  const addGenre = () => {
    const v = newGenre.trim()
    if (!v || list.includes(v)) return
    setList(l => [...l, v])
    setNewGenre('')
  }

  const handleSave = async () => {
    setSaving(true)
    await onSave(list.map(g => g.trim()).filter(Boolean))
    setSaving(false)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border-mid)',
        borderRadius: 'var(--radius-lg)', width: 360, padding: 0,
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '0.5px solid var(--border)' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Manage genres</span>
          <button onClick={onClose} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '12px 16px', maxHeight: 340, overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
            {list.map((g, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '2px 4px 2px 8px',
                background: 'var(--surface-2)', borderRadius: 'var(--radius)', border: '0.5px solid var(--border)',
              }}>
                <input
                  value={g}
                  onChange={e => updateAt(i, e.target.value)}
                  style={{
                    flex: 1, fontSize: 12, border: 'none', outline: 'none', background: 'transparent',
                    fontFamily: 'var(--font)', color: 'var(--text-primary)', padding: '5px 0',
                  }}
                />
                <button onClick={() => removeAt(i)} aria-label={`Remove ${g}`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 4, display: 'flex' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {list.length === 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: 8 }}>No genres yet.</div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              placeholder="New genre…"
              value={newGenre}
              onChange={e => setNewGenre(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addGenre()}
              style={{
                flex: 1, fontSize: 11, padding: '4px 8px',
                border: '0.5px solid var(--border-mid)', borderRadius: 'var(--radius)',
                fontFamily: 'var(--font)', color: 'var(--text-primary)', background: 'var(--surface)', outline: 'none',
              }}
            />
            <button onClick={addGenre} style={{
              display: 'flex', alignItems: 'center', gap: 3, padding: '3px 9px',
              background: 'var(--accent)', color: '#fff', border: 'none',
              borderRadius: 'var(--radius)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font)',
            }}>
              <Plus size={11} /> Add
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, padding: '10px 16px', borderTop: '0.5px solid var(--border)' }}>
          <button onClick={onClose} style={{ padding: '4px 10px', border: '0.5px solid var(--border-mid)', borderRadius: 'var(--radius)', background: 'transparent', fontSize: 12, cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'var(--font)' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '4px 11px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

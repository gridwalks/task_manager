import { useState } from 'react'
import { X, Trash2, Plus } from 'lucide-react'

export default function JournalTagSettings({ journalTags, onSave, onClose }) {
  const [tags, setTags] = useState(JSON.parse(JSON.stringify(journalTags)))
  const [newTag, setNewTag] = useState({ label: '', bg: '#EEEEFF', text: '#3C3489' })
  const [saving, setSaving] = useState(false)

  const addTag = () => {
    if (!newTag.label.trim()) return
    const id = newTag.label.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now()
    setTags(t => [...t, { ...newTag, id }])
    setNewTag({ label: '', bg: '#EEEEFF', text: '#3C3489' })
  }

  const removeTag = (id) => setTags(t => t.filter(x => x.id !== id))

  const handleSave = async () => {
    setSaving(true)
    await onSave(tags)
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
        borderRadius: 'var(--radius-lg)', width: 380, padding: 0,
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '0.5px solid var(--border)' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Journal tags</span>
          <button onClick={onClose} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '12px 16px', maxHeight: 340, overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
            {tags.map(tag => (
              <div key={tag.id} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                background: 'var(--surface-2)', borderRadius: 'var(--radius)', border: '0.5px solid var(--border)',
              }}>
                <span style={{
                  fontSize: 10, padding: '1px 7px', borderRadius: 10,
                  background: tag.bg, color: tag.text, fontWeight: 500,
                }}>
                  {tag.label}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                  <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    BG
                    <input type="color" value={tag.bg}
                      onChange={e => setTags(ts => ts.map(t => t.id === tag.id ? { ...t, bg: e.target.value } : t))}
                      style={{ width: 22, height: 22, border: '0.5px solid var(--border-mid)', borderRadius: 4, cursor: 'pointer', padding: 1 }}
                    />
                  </label>
                  <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    Text
                    <input type="color" value={tag.text}
                      onChange={e => setTags(ts => ts.map(t => t.id === tag.id ? { ...t, text: e.target.value } : t))}
                      style={{ width: 22, height: 22, border: '0.5px solid var(--border-mid)', borderRadius: 4, cursor: 'pointer', padding: 1 }}
                    />
                  </label>
                  <button onClick={() => removeTag(tag.id)} aria-label={`Remove ${tag.label}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, borderRadius: 4, display: 'flex' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <input
              placeholder="New tag name…"
              value={newTag.label}
              onChange={e => setNewTag(n => ({ ...n, label: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addTag()}
              style={{
                flex: 1, fontSize: 11, padding: '4px 8px',
                border: '0.5px solid var(--border-mid)', borderRadius: 'var(--radius)',
                fontFamily: 'var(--font)', color: 'var(--text-primary)', background: 'var(--surface)', outline: 'none',
              }}
            />
            <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
              BG<input type="color" value={newTag.bg} onChange={e => setNewTag(n => ({ ...n, bg: e.target.value }))}
                style={{ width: 22, height: 22, border: '0.5px solid var(--border-mid)', borderRadius: 4, cursor: 'pointer', padding: 1 }} />
            </label>
            <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
              Text<input type="color" value={newTag.text} onChange={e => setNewTag(n => ({ ...n, text: e.target.value }))}
                style={{ width: 22, height: 22, border: '0.5px solid var(--border-mid)', borderRadius: 4, cursor: 'pointer', padding: 1 }} />
            </label>
            <button onClick={addTag} style={{
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

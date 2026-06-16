import { useState } from 'react'
import { X, Trash2, Plus } from 'lucide-react'

const TABS = ['Tags', 'Assignees', 'Columns', 'Board']

export default function SettingsModal({ config, onSave, onClose }) {
  const [tab, setTab] = useState('Tags')
  const [draft, setDraft] = useState(JSON.parse(JSON.stringify(config)))
  const [saving, setSaving] = useState(false)

  const [newTag, setNewTag] = useState({ label: '', bg: '#EEF0FF', text: '#3C3FB8' })
  const [newAss, setNewAss] = useState({ name: '', initials: '', bg: '#EEF0FF', text: '#3C3FB8' })

  const handleSave = async () => {
    setSaving(true)
    await onSave(draft)
    setSaving(false)
    onClose()
  }

  const addTag = () => {
    if (!newTag.label.trim()) return
    const id = newTag.label.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now()
    setDraft(d => ({ ...d, tags: [...d.tags, { ...newTag, id }] }))
    setNewTag({ label: '', bg: '#EEF0FF', text: '#3C3FB8' })
  }
  const removeTag = (id) => setDraft(d => ({ ...d, tags: d.tags.filter(t => t.id !== id) }))

  const addAss = () => {
    if (!newAss.name.trim() || !newAss.initials.trim()) return
    const id = newAss.initials.toUpperCase()
    setDraft(d => ({ ...d, assignees: [...d.assignees, { ...newAss, id, initials: id }] }))
    setNewAss({ name: '', initials: '', bg: '#EEF0FF', text: '#3C3FB8' })
  }
  const removeAss = (id) => setDraft(d => ({ ...d, assignees: d.assignees.filter(a => a.id !== id) }))

  const updateCol = (idx, field, val) => setDraft(d => {
    const cols = [...d.columns]
    cols[idx] = { ...cols[idx], [field]: val }
    return { ...d, columns: cols }
  })

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" style={{ width: 460 }} role="dialog" aria-modal="true" aria-label="Board settings">
        <div className="modal-hdr">
          <span style={{ fontSize: 13, fontWeight: 500 }}>Board settings</span>
          <button className="icon-btn" onClick={onClose} aria-label="Close" style={{ marginLeft: 'auto' }}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', gap: 4, padding: '10px 16px 0', borderBottom: '0.5px solid var(--border)' }}>
          {TABS.map(t => (
            <button key={t} className={`tab-btn${tab === t ? ' tab-active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        <div className="modal-body" style={{ maxHeight: 420, overflowY: 'auto' }}>

          {tab === 'Tags' && (
            <div>
              <div className="config-list">
                {draft.tags.map(t => (
                  <div key={t.id} className="config-row">
                    <span className="color-dot" style={{ background: t.bg, border: `1.5px solid ${t.text}` }} />
                    <span className="config-name">{t.label}</span>
                    <button className="icon-btn icon-btn-danger" onClick={() => removeTag(t.id)} aria-label={`Remove ${t.label}`}><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
              <div className="add-row-inline">
                <input className="field-inp" placeholder="Tag name…" value={newTag.label} onChange={e => setNewTag(n => ({ ...n, label: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addTag()} style={{ flex: 1 }} />
                <label className="color-label">BG<input type="color" value={newTag.bg} onChange={e => setNewTag(n => ({ ...n, bg: e.target.value }))} /></label>
                <label className="color-label">Text<input type="color" value={newTag.text} onChange={e => setNewTag(n => ({ ...n, text: e.target.value }))} /></label>
                <button className="btn btn-primary btn-sm" onClick={addTag}><Plus size={11} /> Add</button>
              </div>
            </div>
          )}

          {tab === 'Assignees' && (
            <div>
              <div className="config-list">
                {draft.assignees.map(a => (
                  <div key={a.id} className="config-row">
                    <span className="av av-sm" style={{ background: a.bg, color: a.text }}>{a.initials}</span>
                    <span className="config-name">{a.name}</span>
                    <span className="config-sub">{a.initials}</span>
                    <button className="icon-btn icon-btn-danger" onClick={() => removeAss(a.id)} aria-label={`Remove ${a.name}`}><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
              <div className="add-row-inline" style={{ flexWrap: 'wrap', gap: 6 }}>
                <input className="field-inp" placeholder="Full name…" value={newAss.name} onChange={e => setNewAss(n => ({ ...n, name: e.target.value }))} style={{ flex: 2, minWidth: 120 }} />
                <input className="field-inp" placeholder="Initials" maxLength={3} value={newAss.initials} onChange={e => setNewAss(n => ({ ...n, initials: e.target.value.toUpperCase() }))} style={{ width: 70 }} />
                <label className="color-label">BG<input type="color" value={newAss.bg} onChange={e => setNewAss(n => ({ ...n, bg: e.target.value }))} /></label>
                <label className="color-label">Text<input type="color" value={newAss.text} onChange={e => setNewAss(n => ({ ...n, text: e.target.value }))} /></label>
                <button className="btn btn-primary btn-sm" onClick={addAss}><Plus size={11} /> Add</button>
              </div>
            </div>
          )}

          {tab === 'Columns' && (
            <div className="config-list">
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Rename columns or change their accent color.</p>
              {draft.columns.map((c, i) => (
                <div key={c.id} className="config-row">
                  <span className="col-rail-preview" style={{ background: c.color }} />
                  <input className="field-inp" value={c.label} onChange={e => updateCol(i, 'label', e.target.value)} style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 12 }} />
                  <input type="color" value={c.color} onChange={e => updateCol(i, 'color', e.target.value)} style={{ width: 26, height: 26, border: '0.5px solid var(--border)', borderRadius: 6, cursor: 'pointer', padding: 1 }} />
                </div>
              ))}
            </div>
          )}

          {tab === 'Board' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="field-lbl">Board name</label>
                <input className="field-inp" value={draft.boardName} onChange={e => setDraft(d => ({ ...d, boardName: e.target.value }))} />
              </div>
              <div>
                <label className="field-lbl">Accent color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="color" value={draft.accent} onChange={e => setDraft(d => ({ ...d, accent: e.target.value }))} style={{ width: 34, height: 30, border: '0.5px solid var(--border)', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{draft.accent} — used on buttons, active filters, and highlights</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>
        </div>
      </div>
    </div>
  )
}

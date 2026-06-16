import { useRef, useState } from 'react'
import { X } from 'lucide-react'

export default function AddTaskModal({ defaultStatus, config, onAdd, onClose }) {
  const [form, setForm] = useState({
    title: '',
    status: defaultStatus || config.columns[0]?.id || 'todo',
    tag: config.tags[0]?.id || '',
    assignee_id: '',
    priority: '',
    due_date: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const titleRef = useRef()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { titleRef.current?.focus(); return }
    setSaving(true)
    try { await onAdd(form); onClose() } finally { setSaving(false) }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" role="dialog" aria-modal="true" aria-label="Add task">
        <div className="modal-hdr" style={{ borderBottom: '0.5px solid var(--border)' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>New task</span>
          <button className="icon-btn" onClick={onClose} aria-label="Close" style={{ marginLeft: 'auto' }}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div>
            <label className="field-lbl">Title</label>
            <input
              ref={titleRef}
              autoFocus
              className="field-inp"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Task title…"
              required
            />
          </div>
          <div className="field-grid">
            <div>
              <label className="field-lbl">Column</label>
              <select className="field-sel" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {config.columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="field-lbl">Tag</label>
              <select className="field-sel" value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}>
                <option value="">None</option>
                {config.tags.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="field-lbl">Assignee</label>
              <select className="field-sel" value={form.assignee_id} onChange={e => setForm(f => ({ ...f, assignee_id: e.target.value }))}>
                <option value="">None</option>
                {config.assignees.map(a => <option key={a.id} value={a.id}>{a.initials} — {a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="field-lbl">Priority</label>
              <select className="field-sel" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="">None</option>
                <option value="high">High</option>
                <option value="med">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="field-lbl">Due date</label>
              <input type="date" className="field-sel" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="field-lbl">Notes</label>
            <textarea className="notes-area" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes…" />
          </div>
          <div className="modal-footer" style={{ marginTop: 0 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Adding…' : 'Add task'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

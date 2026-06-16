import { useEffect, useRef, useState } from 'react'
import { Trash2, X } from 'lucide-react'

export default function TaskModal({ task, config, onUpdate, onDelete, onClose }) {
  const [form, setForm] = useState({
    title: task.title,
    status: task.status,
    tag: task.tag || '',
    assignee_id: task.assignee_id || '',
    priority: task.priority || '',
    due_date: task.due_date || '',
    notes: task.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const titleRef = useRef()

  useEffect(() => { titleRef.current?.focus() }, [])

  const col = config.columns.find(c => c.id === form.status)

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSave = async () => {
    setSaving(true)
    try { await onUpdate(task.id, form) } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (window.confirm('Delete this task? This cannot be undone.')) {
      await onDelete(task.id)
      onClose()
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" role="dialog" aria-modal="true" aria-label="Task detail">
        <div className="modal-hdr">
          <div className="modal-rail" style={{ background: col?.color || '#ccc' }} />
          <div style={{ flex: 1 }}>
            <div className="p-id">{task.short_id || task.id.slice(0, 8)}</div>
            <input
              ref={titleRef}
              className="modal-title-inp"
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              onBlur={handleSave}
            />
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>

        <div className="modal-body">
          <div className="field-row">
            <label className="field-lbl">Status</label>
            <div className="chips">
              {config.columns.map(c => (
                <button
                  key={c.id}
                  className={`chip${form.status === c.id ? ' chip-active' : ''}`}
                  style={form.status === c.id ? { background: c.color + '22', color: c.color, borderColor: c.color } : {}}
                  onClick={() => { handleChange('status', c.id); onUpdate(task.id, { ...form, status: c.id }) }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field-grid">
            <div>
              <label className="field-lbl">Tag</label>
              <select className="field-sel" value={form.tag} onChange={e => { handleChange('tag', e.target.value); onUpdate(task.id, { ...form, tag: e.target.value }) }}>
                <option value="">None</option>
                {config.tags.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="field-lbl">Assignee</label>
              <select className="field-sel" value={form.assignee_id} onChange={e => { handleChange('assignee_id', e.target.value); onUpdate(task.id, { ...form, assignee_id: e.target.value }) }}>
                <option value="">None</option>
                {config.assignees.map(a => <option key={a.id} value={a.id}>{a.initials} — {a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="field-lbl">Priority</label>
              <select className="field-sel" value={form.priority} onChange={e => { handleChange('priority', e.target.value); onUpdate(task.id, { ...form, priority: e.target.value }) }}>
                <option value="">None</option>
                <option value="high">High</option>
                <option value="med">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="field-lbl">Due date</label>
              <input type="date" className="field-sel" value={form.due_date} onChange={e => { handleChange('due_date', e.target.value); onUpdate(task.id, { ...form, due_date: e.target.value }) }} />
            </div>
          </div>

          <div>
            <label className="field-lbl">Notes</label>
            <textarea
              className="notes-area"
              value={form.notes}
              onChange={e => handleChange('notes', e.target.value)}
              onBlur={handleSave}
              placeholder="Add notes…"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={12} /> Delete</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  )
}

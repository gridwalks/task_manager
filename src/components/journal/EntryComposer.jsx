import { useCallback, useEffect, useRef, useState } from 'react'
import { Trash2, Lock, Unlock, Link2, X } from 'lucide-react'
import MoodPicker from './MoodPicker'
import TagPicker from './TagPicker'
import JournalTagSettings from './JournalTagSettings'
import { ENTRY_TYPES } from '../../hooks/useJournalConfig'
import { formatEntryDateLong, todayISO, wordCountLabel } from '../../lib/journalUtils'

const AUTOSAVE_DELAY = 1500

export default function EntryComposer({ entry, journalTags, tasks, onSave, onDelete, onSaveJournalTags }) {
  const isNew = !entry?.id
  const [form, setForm] = useState({
    title: entry?.title || '',
    body: entry?.body || '',
    entry_date: entry?.entry_date || todayISO(),
    entry_type: entry?.entry_type || 'reflection',
    mood: entry?.mood || null,
    tags: entry?.tags || [],
    linked_task_id: entry?.linked_task_id || null,
    is_private: entry?.is_private || false,
  })
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [showTagSettings, setShowTagSettings] = useState(false)
  const [showTaskPicker, setShowTaskPicker] = useState(false)
  const autosaveTimer = useRef(null)
  const bodyRef = useRef()

  useEffect(() => {
    if (entry) {
      setForm({
        title: entry.title || '',
        body: entry.body || '',
        entry_date: entry.entry_date || todayISO(),
        entry_type: entry.entry_type || 'reflection',
        mood: entry.mood || null,
        tags: entry.tags || [],
        linked_task_id: entry.linked_task_id || null,
        is_private: entry.is_private || false,
      })
      setSavedAt(null)
    }
  }, [entry?.id])

  const save = useCallback(async (data) => {
    if (!data.body?.trim() && !data.title?.trim()) return
    setSaving(true)
    try {
      await onSave(data)
      setSavedAt(new Date())
    } finally {
      setSaving(false)
    }
  }, [onSave])

  const scheduleAutosave = useCallback((data) => {
    if (isNew) return
    clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => save(data), AUTOSAVE_DELAY)
  }, [isNew, save])

  useEffect(() => () => clearTimeout(autosaveTimer.current), [])

  const update = (field, value) => {
    const next = { ...form, [field]: value }
    setForm(next)
    scheduleAutosave(next)
  }

  const handleSave = () => {
    clearTimeout(autosaveTimer.current)
    save(form)
  }

  const handleDelete = async () => {
    if (window.confirm('Delete this journal entry? This cannot be undone.')) {
      await onDelete(entry.id)
    }
  }

  const linkedTask = form.linked_task_id ? tasks.find(t => t.id === form.linked_task_id) : null
  const type = ENTRY_TYPES.find(t => t.id === form.entry_type)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 16, gap: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ flex: 1 }}>
          <input
            type="date"
            value={form.entry_date}
            onChange={e => update('entry_date', e.target.value)}
            style={{
              fontSize: 11, border: 'none', outline: 'none', background: 'transparent',
              color: 'var(--text-muted)', fontFamily: 'var(--font)', cursor: 'pointer', marginBottom: 2,
            }}
          />
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
            {formatEntryDateLong(form.entry_date)}
          </div>
        </div>
        {savedAt && !saving && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', alignSelf: 'flex-end' }}>
            Saved {savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {saving && <span style={{ fontSize: 10, color: 'var(--text-muted)', alignSelf: 'flex-end' }}>Saving…</span>}
      </div>

      {/* Type + Mood */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {ENTRY_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => update('entry_type', t.id)}
              aria-pressed={form.entry_type === t.id}
              style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 10, cursor: 'pointer',
                fontFamily: 'var(--font)', border: `0.5px solid ${form.entry_type === t.id ? t.text + '66' : 'var(--border)'}`,
                background: form.entry_type === t.id ? t.bg : 'transparent',
                color: form.entry_type === t.id ? t.text : 'var(--text-muted)',
                fontWeight: form.entry_type === t.id ? 500 : 400,
                transition: 'all 0.1s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <MoodPicker value={form.mood} onChange={v => update('mood', v)} />
        </div>
      </div>

      {/* Title */}
      <input
        value={form.title}
        onChange={e => update('title', e.target.value)}
        placeholder="Entry title (optional)…"
        style={{
          width: '100%', fontSize: 15, fontWeight: 500, border: 'none', outline: 'none',
          color: 'var(--text-primary)', fontFamily: 'var(--font)', background: 'transparent',
          marginBottom: 10, padding: 0,
        }}
      />

      {/* Body */}
      <textarea
        ref={bodyRef}
        value={form.body}
        onChange={e => update('body', e.target.value)}
        placeholder="Write your thoughts…"
        style={{
          flex: 1, width: '100%', minHeight: 180,
          border: 'none', outline: 'none', resize: 'none',
          fontSize: 13, lineHeight: 1.7,
          fontFamily: 'Georgia, "Times New Roman", serif',
          color: 'var(--text-primary)', background: 'transparent',
          marginBottom: 12,
        }}
      />

      {/* Tags */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Tags</div>
        <TagPicker
          journalTags={journalTags}
          selected={form.tags}
          onChange={v => update('tags', v)}
          onManage={() => setShowTagSettings(true)}
        />
      </div>

      {/* Linked task */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Linked task</div>
        {linkedTask ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '5px 9px',
            background: 'var(--surface-2)', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius)', fontSize: 11, color: 'var(--text-secondary)',
          }}>
            <Link2 size={11} color="var(--accent)" />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {linkedTask.short_id || linkedTask.id.slice(0, 8)} · {linkedTask.title}
            </span>
            <button onClick={() => update('linked_task_id', null)} aria-label="Remove link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}>
              <X size={11} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowTaskPicker(true)}
            style={{
              fontSize: 11, padding: '4px 10px', border: '0.5px dashed var(--border-mid)',
              borderRadius: 'var(--radius)', background: 'transparent', color: 'var(--text-muted)',
              cursor: 'pointer', fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <Link2 size={11} /> Link a task…
          </button>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 10, borderTop: '0.5px solid var(--border)' }}>
        {form.body && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{wordCountLabel(form.body)}</span>
        )}
        <button
          onClick={() => update('is_private', !form.is_private)}
          aria-label={form.is_private ? 'Make public' : 'Make private'}
          title={form.is_private ? 'Private — click to make visible' : 'Visible — click to make private'}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 10, color: form.is_private ? 'var(--accent)' : 'var(--text-muted)',
            fontFamily: 'var(--font)', marginLeft: form.body ? 4 : 0,
          }}
        >
          {form.is_private ? <Lock size={11} /> : <Unlock size={11} />}
          {form.is_private ? 'Private' : 'Visible'}
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
          {!isNew && (
            <button onClick={handleDelete} aria-label="Delete entry" style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px',
              border: '0.5px solid #F09595', borderRadius: 'var(--radius)',
              background: 'transparent', color: '#A32D2D', cursor: 'pointer',
              fontSize: 11, fontFamily: 'var(--font)',
            }}>
              <Trash2 size={11} /> Delete
            </button>
          )}
          <button onClick={handleSave} disabled={saving} style={{
            padding: '4px 12px', background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius)', fontSize: 11,
            cursor: 'pointer', fontFamily: 'var(--font)', opacity: saving ? 0.6 : 1,
          }}>
            {isNew ? 'Save entry' : saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Tag settings modal */}
      {showTagSettings && (
        <JournalTagSettings
          journalTags={journalTags}
          onSave={onSaveJournalTags}
          onClose={() => setShowTagSettings(false)}
        />
      )}

      {/* Task picker */}
      {showTaskPicker && (
        <TaskPickerModal
          tasks={tasks}
          onSelect={id => { update('linked_task_id', id); setShowTaskPicker(false) }}
          onClose={() => setShowTaskPicker(false)}
        />
      )}
    </div>
  )
}

function TaskPickerModal({ tasks, onSelect, onClose }) {
  const [q, setQ] = useState('')
  const filtered = tasks.filter(t =>
    !q || t.title.toLowerCase().includes(q.toLowerCase()) || (t.short_id || '').toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border-mid)',
        borderRadius: 'var(--radius-lg)', width: 360, padding: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '0.5px solid var(--border)' }}>
          <input
            autoFocus
            placeholder="Search tasks…"
            value={q}
            onChange={e => setQ(e.target.value)}
            style={{
              flex: 1, fontSize: 12, border: 'none', outline: 'none',
              fontFamily: 'var(--font)', color: 'var(--text-primary)', background: 'transparent',
            }}
          />
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>
        </div>
        <div style={{ maxHeight: 280, overflowY: 'auto', padding: 8 }}>
          {filtered.length === 0 && (
            <div style={{ padding: '16px 8px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>No tasks found</div>
          )}
          {filtered.map(t => (
            <div
              key={t.id}
              onClick={() => onSelect(t.id)}
              style={{
                padding: '7px 10px', borderRadius: 'var(--radius)', cursor: 'pointer',
                fontSize: 12, color: 'var(--text-primary)',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--text-muted)', flexShrink: 0 }}>
                {t.short_id || t.id.slice(0, 8)}
              </span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
              <span style={{
                fontSize: 9, padding: '1px 5px', borderRadius: 8,
                background: 'var(--surface-2)', color: 'var(--text-muted)', border: '0.5px solid var(--border)', flexShrink: 0,
              }}>
                {t.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

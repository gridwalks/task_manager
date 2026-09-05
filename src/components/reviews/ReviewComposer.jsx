import { useCallback, useEffect, useRef, useState } from 'react'
import { Trash2, Link2, X, Copy, Check } from 'lucide-react'
import StarRating from './StarRating'
import CoverUpload from './CoverUpload'
import RichEditor from '../journal/RichEditor'
import { TaskPickerModal } from '../journal/EntryComposer'
import { REVIEW_STATUSES } from '../../hooks/useBookReviews'
import { formatEntryDateLong, todayISO, wordCountLabel } from '../../lib/journalUtils'

const AUTOSAVE_DELAY = 1500

function scriptToPlainText(html) {
  const div = document.createElement('div')
  div.innerHTML = (html || '')
    .replace(/<\/(p|h[1-6]|li|blockquote)>/g, '\n')
    .replace(/<br\s*\/?>/g, '\n')
  return div.textContent.replace(/\n{3,}/g, '\n\n').trim()
}

export default function ReviewComposer({ review, tasks, onSave, onDelete }) {
  const isNew = !review?.id
  const [form, setForm] = useState({
    title: review?.title || '',
    author: review?.author || '',
    series_position: review?.series_position || '',
    script: review?.script || '',
    notes: review?.notes || '',
    review_date: review?.review_date || todayISO(),
    status: review?.status || 'draft',
    rating: review?.rating || null,
    linked_task_id: review?.linked_task_id || null,
    cover_path: review?.cover_path || null,
  })
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [showTaskPicker, setShowTaskPicker] = useState(false)
  const autosaveTimer = useRef(null)

  useEffect(() => {
    if (review) {
      setForm({
        title: review.title || '',
        author: review.author || '',
        series_position: review.series_position || '',
        script: review.script || '',
        notes: review.notes || '',
        review_date: review.review_date || todayISO(),
        status: review.status || 'draft',
        rating: review.rating || null,
        linked_task_id: review.linked_task_id || null,
        cover_path: review.cover_path || null,
      })
      setSavedAt(null)
    }
  }, [review?.id])

  const save = useCallback(async (data) => {
    if (!data.title?.trim() && !scriptToPlainText(data.script)) return
    setSaving(true)
    try {
      await onSave(data)
      setSavedAt(new Date())
      setSaveError(null)
    } catch (e) {
      setSaveError(e.message || 'Save failed')
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
    if (window.confirm('Delete this book review? This cannot be undone.')) {
      await onDelete(review.id)
    }
  }

  const handleCopyScript = async () => {
    const plain = scriptToPlainText(form.script)
    if (!plain) return
    try {
      await navigator.clipboard.writeText(plain)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* clipboard unavailable */ }
  }

  const linkedTask = form.linked_task_id ? tasks.find(t => t.id === form.linked_task_id) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 16, gap: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ flex: 1 }}>
          <input
            type="date"
            value={form.review_date}
            onChange={e => update('review_date', e.target.value)}
            style={{
              fontSize: 11, border: 'none', outline: 'none', background: 'transparent',
              color: 'var(--text-muted)', fontFamily: 'var(--font)', cursor: 'pointer', marginBottom: 2,
            }}
          />
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
            {formatEntryDateLong(form.review_date)}
          </div>
        </div>
        {saveError && !saving && (
          <span style={{ fontSize: 10, color: '#A32D2D', alignSelf: 'flex-end', maxWidth: 220, textAlign: 'right' }}>
            {saveError}
          </span>
        )}
        {savedAt && !saving && !saveError && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', alignSelf: 'flex-end' }}>
            Saved {savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {saving && <span style={{ fontSize: 10, color: 'var(--text-muted)', alignSelf: 'flex-end' }}>Saving…</span>}
      </div>

      {/* Status + Rating */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {REVIEW_STATUSES.map(s => (
            <button
              key={s.id}
              onClick={() => update('status', s.id)}
              aria-pressed={form.status === s.id}
              style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 10, cursor: 'pointer',
                fontFamily: 'var(--font)', border: `0.5px solid ${form.status === s.id ? s.text + '66' : 'var(--border)'}`,
                background: form.status === s.id ? s.bg : 'transparent',
                color: form.status === s.id ? s.text : 'var(--text-muted)',
                fontWeight: form.status === s.id ? 500 : 400,
                transition: 'all 0.1s',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <StarRating value={form.rating} onChange={v => update('rating', v)} />
        </div>
      </div>

      {/* Cover + book details */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 12, alignItems: 'flex-start' }}>
        <CoverUpload
          coverPath={form.cover_path}
          onChange={p => update('cover_path', p)}
        />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
          <input
            value={form.title}
            onChange={e => update('title', e.target.value)}
            placeholder="Book title…"
            style={{
              width: '100%', fontSize: 15, fontWeight: 500, border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontFamily: 'var(--font)', background: 'transparent',
              padding: 0,
            }}
          />
          <input
            value={form.author}
            onChange={e => update('author', e.target.value)}
            placeholder="Author…"
            style={{
              width: '100%', fontSize: 12, border: 'none', outline: 'none',
              color: 'var(--text-secondary)', fontFamily: 'var(--font)', background: 'transparent',
              padding: 0,
            }}
          />
          <input
            value={form.series_position}
            onChange={e => update('series_position', e.target.value)}
            placeholder="Series / position (e.g. The Hirathean Path #1)…"
            style={{
              width: '100%', fontSize: 12, border: 'none', outline: 'none',
              color: 'var(--text-secondary)', fontFamily: 'var(--font)', background: 'transparent',
              padding: 0,
            }}
          />
        </div>
      </div>

      {/* Script */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TikTok script</div>
        {form.script && (
          <button
            onClick={handleCopyScript}
            title="Copy script as plain text"
            style={{
              display: 'flex', alignItems: 'center', gap: 3, marginLeft: 'auto',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 10, color: copied ? 'var(--accent)' : 'var(--text-muted)', fontFamily: 'var(--font)',
            }}
          >
            {copied ? <Check size={10} /> : <Copy size={10} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0, marginBottom: 12, display: 'flex', flexDirection: 'column' }}>
        <RichEditor
          value={form.script}
          onChange={v => update('script', v)}
          placeholder="Write or paste the TikTok script… [HOOK], [cut], [beat], [end card]"
        />
      </div>

      {/* Notes / accuracy flags */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Notes / accuracy flags</div>
        <textarea
          value={form.notes}
          onChange={e => update('notes', e.target.value)}
          placeholder="Fact-check notes, pen names, content warnings, approval status…"
          rows={2}
          style={{
            width: '100%', border: '0.5px solid var(--border)', borderRadius: 'var(--radius)',
            outline: 'none', resize: 'vertical', padding: '6px 9px',
            fontSize: 11, lineHeight: 1.5, fontFamily: 'var(--font)',
            color: 'var(--text-secondary)', background: 'var(--surface-2)',
          }}
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
        {form.script && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{wordCountLabel(form.script)}</span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
          {!isNew && (
            <button onClick={handleDelete} aria-label="Delete review" style={{
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
            {isNew ? 'Save review' : saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

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

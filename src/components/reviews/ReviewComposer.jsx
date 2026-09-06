import { useCallback, useEffect, useRef, useState } from 'react'
import { Trash2, Link2, X, Copy, Check, Sparkles, Loader, Settings } from 'lucide-react'
import StarRating from './StarRating'
import SpiceRating from './SpiceRating'
import CoverUpload from './CoverUpload'
import GenreSettings from './GenreSettings'
import RichEditor from '../journal/RichEditor'
import { TaskPickerModal } from '../journal/EntryComposer'
import { REVIEW_STATUSES } from '../../hooks/useBookReviews'
import { useReviewGenres } from '../../hooks/useReviewGenres'
import { formatEntryDateLong, todayISO, wordCountLabel } from '../../lib/journalUtils'
import { scriptTextToHtml } from '../../lib/reviewImport'
import { generateTikTokScript } from '../../lib/ai'
import { findBookCoverUrl } from '../../lib/bookCovers'
import { amazonSearchUrl } from '../../lib/amazonAffiliate'
import { useFlushSaveOnHide } from '../../hooks/useFlushSaveOnHide'

const COVER_LOOKUP_DELAY = 1000

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
  const { reviewGenres, saveReviewGenres } = useReviewGenres()
  const [showGenreSettings, setShowGenreSettings] = useState(false)
  const [form, setForm] = useState({
    title: review?.title || '',
    author: review?.author || '',
    series_position: review?.series_position || '',
    genres: review?.genres || [],
    amazon_link: review?.amazon_link || '',
    review_text: review?.review_text || '',
    script: review?.script || '',
    notes: review?.notes || '',
    review_date: review?.review_date || todayISO(),
    status: review?.status || 'draft',
    rating: review?.rating || null,
    spice_level: review?.spice_level || null,
    linked_task_id: review?.linked_task_id || null,
    cover_path: review?.cover_path || null,
    cover_url: review?.cover_url || null,
  })
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [showTaskPicker, setShowTaskPicker] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState(null)
  const autosaveTimer = useRef(null)

  useEffect(() => {
    if (review) {
      setForm({
        title: review.title || '',
        author: review.author || '',
        series_position: review.series_position || '',
        genres: review.genres || [],
        amazon_link: review.amazon_link || '',
        review_text: review.review_text || '',
        script: review.script || '',
        notes: review.notes || '',
        review_date: review.review_date || todayISO(),
        status: review.status || 'draft',
        rating: review.rating || null,
        spice_level: review.spice_level || null,
        linked_task_id: review.linked_task_id || null,
        cover_path: review.cover_path || null,
        cover_url: review.cover_url || null,
      })
      setSavedAt(null)
    }
  }, [review?.id])

  const save = useCallback(async (data) => {
    if (!data.title?.trim() && !scriptToPlainText(data.script) && !scriptToPlainText(data.review_text)) return
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
  useFlushSaveOnHide(form, save, autosaveTimer)

  // Auto-fetch a cover whenever one is missing and a title is present —
  // for a brand-new review (typed, or prefilled via "Start a review" from
  // the Library) and for any existing review you open that never got one.
  // A manual upload always takes precedence and is never overwritten.
  useEffect(() => {
    if (form.cover_path || form.cover_url || !form.title?.trim()) return
    const timer = setTimeout(async () => {
      const url = await findBookCoverUrl(form.title, form.author)
      if (!url) return
      setForm(prev => {
        if (prev.cover_path || prev.cover_url) return prev
        const next = { ...prev, cover_url: url }
        scheduleAutosave(next)
        return next
      })
    }, COVER_LOOKUP_DELAY)
    return () => clearTimeout(timer)
  }, [form.title, form.author, form.cover_path, form.cover_url, scheduleAutosave])

  // Auto-fill the Amazon link the same way — a tagged Amazon search link
  // built straight from the review's own title/author, no other table
  // involved. The tag sets Amazon's affiliate tracking cookie the moment
  // the search page loads, valid for 24 hours — clicking through to buy
  // the actual book (or anything else) still earns commission, even
  // though that next page's URL won't visibly show the tag anymore.
  // Never overwrites a link you've entered.
  useEffect(() => {
    if (form.amazon_link || !form.title?.trim()) return
    const timer = setTimeout(() => {
      const url = amazonSearchUrl(form.title, form.author)
      setForm(prev => {
        if (prev.amazon_link) return prev
        const next = { ...prev, amazon_link: url }
        scheduleAutosave(next)
        return next
      })
    }, COVER_LOOKUP_DELAY)
    return () => clearTimeout(timer)
  }, [form.title, form.author, form.amazon_link, scheduleAutosave])

  const update = (field, value) => {
    const next = { ...form, [field]: value }
    setForm(next)
    scheduleAutosave(next)
  }

  const toggleGenre = (g) => {
    const next = form.genres.includes(g) ? form.genres.filter(x => x !== g) : [...form.genres, g]
    update('genres', next)
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

  const handleGenerateScript = async () => {
    const reviewPlain = scriptToPlainText(form.review_text)
    if (!reviewPlain) return
    if (scriptToPlainText(form.script) && !window.confirm('Replace the current TikTok script with a new AI-generated one?')) return

    setGenerating(true)
    setGenerateError(null)
    try {
      const script = await generateTikTokScript({
        title: form.title,
        author: form.author,
        seriesPosition: form.series_position,
        reviewText: reviewPlain,
      })
      update('script', scriptTextToHtml(script))
    } catch (e) {
      setGenerateError(e.message || 'Script generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const linkedTask = form.linked_task_id ? tasks.find(t => t.id === form.linked_task_id) : null
  const hasReviewText = !!scriptToPlainText(form.review_text)

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

      {/* Spice level */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <SpiceRating value={form.spice_level} onChange={v => update('spice_level', v)} />
      </div>

      {/* Cover + book details */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 12, alignItems: 'flex-start' }}>
        <CoverUpload
          coverPath={form.cover_path}
          coverUrl={form.cover_url}
          onChangePath={p => update('cover_path', p)}
          onChangeUrl={u => update('cover_url', u)}
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

      {/* Genres */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Genres</div>
          <button
            onClick={() => setShowGenreSettings(true)}
            title="Manage genres"
            style={{
              display: 'flex', alignItems: 'center', gap: 3, marginLeft: 'auto',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font)',
            }}
          >
            <Settings size={10} /> Manage
          </button>
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {reviewGenres.map(g => {
            const active = form.genres.includes(g)
            return (
              <button
                key={g}
                onClick={() => toggleGenre(g)}
                aria-pressed={active}
                style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 10, cursor: 'pointer',
                  fontFamily: 'var(--font)', border: `0.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  background: active ? '#EEEEFF' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  fontWeight: active ? 500 : 400,
                  transition: 'all 0.1s',
                }}
              >
                {g}
              </button>
            )
          })}
        </div>
      </div>

      {/* Amazon affiliate link */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Amazon affiliate link</div>
        <input
          type="url"
          value={form.amazon_link}
          onChange={e => update('amazon_link', e.target.value)}
          placeholder="https://www.amazon.com/dp/…?tag=your-affiliate-id"
          style={{
            width: '100%', fontSize: 12, border: '0.5px solid var(--border)', borderRadius: 'var(--radius)',
            outline: 'none', padding: '6px 9px', fontFamily: 'var(--font)',
            color: 'var(--text-primary)', background: 'var(--surface-2)',
          }}
        />
      </div>

      {/* Book review */}
      <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Book review</div>
      <div style={{ height: 220, marginBottom: 14, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <RichEditor
          value={form.review_text}
          onChange={v => update('review_text', v)}
          placeholder="Write the full review here…"
        />
      </div>

      {/* Script */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TikTok script</div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={handleGenerateScript}
            disabled={generating || !hasReviewText}
            title={hasReviewText ? 'Generate a script from the book review with Claude' : 'Write a book review first'}
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              background: 'none', border: 'none', cursor: (generating || !hasReviewText) ? 'default' : 'pointer',
              fontSize: 10, color: generating ? 'var(--text-muted)' : 'var(--accent)', fontFamily: 'var(--font)',
              opacity: hasReviewText ? 1 : 0.5,
            }}
          >
            {generating ? <Loader size={10} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Sparkles size={10} />}
            {generating ? 'Generating…' : 'Generate with AI'}
          </button>
          {form.script && (
            <button
              onClick={handleCopyScript}
              title="Copy script as plain text"
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 10, color: copied ? 'var(--accent)' : 'var(--text-muted)', fontFamily: 'var(--font)',
              }}
            >
              {copied ? <Check size={10} /> : <Copy size={10} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
      </div>
      {generateError && (
        <div style={{ fontSize: 10, color: '#A32D2D', marginBottom: 5 }}>{generateError}</div>
      )}
      <div style={{ height: 220, marginBottom: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '10px 0 4px',
        borderTop: '0.5px solid var(--border)', position: 'sticky', bottom: 0,
        background: 'var(--surface)', zIndex: 2,
      }}>
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

      {/* Genre settings */}
      {showGenreSettings && (
        <GenreSettings
          genres={reviewGenres}
          onSave={saveReviewGenres}
          onClose={() => setShowGenreSettings(false)}
        />
      )}
    </div>
  )
}

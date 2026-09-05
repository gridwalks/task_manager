import { useMemo, useState } from 'react'
import { Plus, Search, Star } from 'lucide-react'
import { useBookReviews, REVIEW_STATUSES } from '../hooks/useBookReviews'
import { useTasks } from '../hooks/useTasks'
import ReviewCard from '../components/reviews/ReviewCard'
import ReviewComposer from '../components/reviews/ReviewComposer'
import { todayISO, groupByMonth, formatMonthKey } from '../lib/journalUtils'

const EMPTY_REVIEW = {
  title: '', author: '', series_position: '',
  script: '', notes: '', review_date: todayISO(),
  status: 'draft', rating: null, linked_task_id: null,
}

export default function ReviewsPage() {
  const { reviews, loading, addReview, updateReview, deleteReview } = useBookReviews()
  const { tasks } = useTasks()

  const [activeId, setActiveId] = useState(null)
  const [isNew, setIsNew] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [ratingFilter, setRatingFilter] = useState('all')

  const filtered = useMemo(() => {
    return reviews.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (ratingFilter !== 'all' && r.rating !== ratingFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (r.title || '').toLowerCase().includes(q)
          || (r.author || '').toLowerCase().includes(q)
          || (r.series_position || '').toLowerCase().includes(q)
          || (r.script || '').toLowerCase().includes(q)
      }
      return true
    })
  }, [reviews, statusFilter, ratingFilter, search])

  const grouped = groupByMonth(filtered, 'review_date')
  const activeReview = isNew ? null : reviews.find(r => r.id === activeId)

  const handleNew = () => { setIsNew(true); setActiveId(null) }
  const handleSelect = (review) => { setActiveId(review.id); setIsNew(false) }

  const handleSave = async (form) => {
    if (isNew) {
      const created = await addReview(form)
      setActiveId(created.id)
      setIsNew(false)
    } else {
      await updateReview(activeId, form)
    }
  }

  const handleDelete = async (id) => {
    await deleteReview(id)
    setActiveId(null)
    setIsNew(false)
  }

  const statusCounts = useMemo(() => {
    const counts = {}
    REVIEW_STATUSES.forEach(s => { counts[s.id] = reviews.filter(r => r.status === s.id).length })
    counts.all = reviews.length
    return counts
  }, [reviews])

  const ratingCounts = useMemo(() => {
    const counts = {}
    for (let n = 1; n <= 5; n++) counts[n] = reviews.filter(r => r.rating === n).length
    return counts
  }, [reviews])

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Status + rating filter panel */}
      <div style={{
        width: 180, flexShrink: 0, background: 'var(--surface-2)',
        borderRight: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column',
        padding: '12px 0', overflowY: 'auto',
      }}>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '0 14px', marginBottom: 4 }}>Status</div>
        {[{ id: 'all', label: 'All reviews' }, ...REVIEW_STATUSES].map(s => (
          <button key={s.id} onClick={() => setStatusFilter(s.id)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '5px 14px',
            background: statusFilter === s.id ? 'var(--surface)' : 'transparent',
            border: 'none', cursor: 'pointer', fontSize: 12,
            color: statusFilter === s.id ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: statusFilter === s.id ? 500 : 400,
            fontFamily: 'var(--font)', width: '100%', textAlign: 'left',
            transition: 'background 0.1s',
          }}>
            <span style={{ flex: 1 }}>{s.label}</span>
            <span style={{
              fontSize: 9, padding: '1px 5px', borderRadius: 8,
              background: 'var(--surface)', border: '0.5px solid var(--border)',
              color: 'var(--text-muted)',
            }}>
              {statusCounts[s.id] || 0}
            </span>
          </button>
        ))}

        <div style={{ height: '0.5px', background: 'var(--border)', margin: '10px 14px' }} />
        <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '0 14px', marginBottom: 4 }}>Rating</div>
        <button onClick={() => setRatingFilter('all')} style={{
          display: 'flex', alignItems: 'center', padding: '5px 14px',
          background: ratingFilter === 'all' ? 'var(--surface)' : 'transparent',
          border: 'none', cursor: 'pointer', fontSize: 12,
          color: ratingFilter === 'all' ? 'var(--accent)' : 'var(--text-secondary)',
          fontFamily: 'var(--font)', width: '100%', textAlign: 'left',
        }}>
          All ratings
        </button>
        {[5, 4, 3, 2, 1].map(n => (
          <button key={n} onClick={() => setRatingFilter(n === ratingFilter ? 'all' : n)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '5px 14px',
            background: ratingFilter === n ? 'var(--surface)' : 'transparent',
            border: 'none', cursor: 'pointer', fontSize: 12,
            color: ratingFilter === n ? 'var(--accent)' : 'var(--text-secondary)',
            fontFamily: 'var(--font)', width: '100%', textAlign: 'left',
            transition: 'background 0.1s',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              {Array.from({ length: n }, (_, i) => (
                <Star key={i} size={9} fill="#D9A404" color="#D9A404" />
              ))}
            </span>
            <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{ratingCounts[n] || 0}</span>
          </button>
        ))}
      </div>

      {/* Review list */}
      <div style={{ width: 260, flexShrink: 0, borderRight: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px 10px 6px', borderBottom: '0.5px solid var(--border)', background: 'var(--surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Book Reviews</span>
            <button onClick={handleNew} style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3,
              padding: '3px 9px', background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius)', fontSize: 11,
              cursor: 'pointer', fontFamily: 'var(--font)',
            }}>
              <Plus size={11} /> New
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 1, padding: '4px 8px', border: '0.5px solid var(--border-mid)', borderRadius: 'var(--radius)', background: 'var(--surface-2)' }}>
            <Search size={11} color="var(--text-muted)" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search title, author, script…"
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontSize: 11, fontFamily: 'var(--font)', color: 'var(--text-primary)', marginLeft: 5,
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {loading && <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>Loading…</div>}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {search || statusFilter !== 'all' || ratingFilter !== 'all'
                ? 'No reviews match your filters.'
                : 'No reviews yet.\nClick New to add your first book review.'}
            </div>
          )}
          {grouped.map(([monthKey, monthReviews]) => (
            <div key={monthKey}>
              <div style={{ fontSize: 9, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '6px 2px 4px', marginTop: 4 }}>
                {formatMonthKey(monthKey)}
              </div>
              {monthReviews.map(review => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  isActive={!isNew && activeId === review.id}
                  onClick={() => handleSelect(review)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Composer */}
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', background: 'var(--surface)' }}>
        {(isNew || activeReview) ? (
          <ReviewComposer
            key={isNew ? 'new' : activeId}
            review={isNew ? EMPTY_REVIEW : activeReview}
            tasks={tasks}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: 10 }}>
            <div style={{ fontSize: 13 }}>Select a review or</div>
            <button onClick={handleNew} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px',
              background: 'var(--accent)', color: '#fff', border: 'none',
              borderRadius: 'var(--radius)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)',
            }}>
              <Plus size={12} /> Add a book review
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

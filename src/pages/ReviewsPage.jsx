import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus, Search, Star, ChevronLeft } from 'lucide-react'
import { useBookReviews, REVIEW_STATUSES } from '../hooks/useBookReviews'
import { useTasks } from '../hooks/useTasks'
import { useIsMobile } from '../hooks/useIsMobile'
import ReviewCard from '../components/reviews/ReviewCard'
import ReviewComposer from '../components/reviews/ReviewComposer'
import ReviewImport from '../components/reviews/ReviewImport'
import { deleteCover } from '../lib/storage'
import { todayISO, groupByMonth, formatMonthKey } from '../lib/journalUtils'

const mobileSelectStyle = {
  flex: 1, fontSize: 12, padding: '6px 8px', border: '0.5px solid var(--border-mid)',
  borderRadius: 'var(--radius)', background: 'var(--surface-2)', color: 'var(--text-secondary)',
  fontFamily: 'var(--font)',
}

const EMPTY_REVIEW = {
  title: '', author: '', series_position: '', genre: '',
  amazon_link: '', review_text: '',
  script: '', notes: '', review_date: todayISO(),
  status: 'draft', rating: null, spice_level: null, linked_task_id: null,
  cover_path: null, cover_url: null,
}

const ACTIVE_ID_KEY = 'reviews:activeId'

function readStoredActiveId() {
  try { return sessionStorage.getItem(ACTIVE_ID_KEY) || null } catch { return null }
}

function writeStoredActiveId(id) {
  try {
    if (id) sessionStorage.setItem(ACTIVE_ID_KEY, id)
    else sessionStorage.removeItem(ACTIVE_ID_KEY)
  } catch { /* storage unavailable */ }
}

export default function ReviewsPage() {
  const { reviews, loading, addReview, updateReview, deleteReview, importReviews } = useBookReviews()
  const { tasks } = useTasks()
  const location = useLocation()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [activeId, setActiveIdState] = useState(readStoredActiveId)
  const setActiveId = (id) => { setActiveIdState(id); writeStoredActiveId(id) }
  const [isNew, setIsNew] = useState(false)
  const [newDefaults, setNewDefaults] = useState(EMPTY_REVIEW)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [ratingFilter, setRatingFilter] = useState('all')

  useEffect(() => {
    if (location.state?.prefill) {
      setNewDefaults({ ...EMPTY_REVIEW, ...location.state.prefill })
      setIsNew(true)
      setActiveId(null)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.state, location.pathname, navigate])

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

  const handleNew = () => { setNewDefaults(EMPTY_REVIEW); setIsNew(true); setActiveId(null) }
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
    const target = reviews.find(r => r.id === id)
    await deleteReview(id)
    if (target?.cover_path) {
      try { await deleteCover(target.cover_path) } catch { /* file may already be gone */ }
    }
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

  if (isMobile && (isNew || activeReview)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: 'var(--surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
          <button
            onClick={() => { setActiveId(null); setIsNew(false) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 13, color: 'var(--accent)', fontFamily: 'var(--font)', padding: 0,
            }}
          >
            <ChevronLeft size={17} /> Reviews
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <ReviewComposer
            key={isNew ? 'new' : activeId}
            review={isNew ? newDefaults : activeReview}
            tasks={tasks}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        </div>
      </div>
    )
  }

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: 'var(--bg)' }}>
        <div style={{ padding: '10px 12px', borderBottom: '0.5px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>Book Reviews</span>
            <button onClick={handleNew} style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 12px', background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius)', fontSize: 12,
              cursor: 'pointer', fontFamily: 'var(--font)',
            }}>
              <Plus size={13} /> New
            </button>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 1, padding: '6px 10px',
            border: '0.5px solid var(--border-mid)', borderRadius: 'var(--radius)',
            background: 'var(--surface-2)', marginBottom: 8,
          }}>
            <Search size={13} color="var(--text-muted)" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search title, author, script…"
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontSize: 13, fontFamily: 'var(--font)', color: 'var(--text-primary)', marginLeft: 6,
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={mobileSelectStyle}>
              <option value="all">All statuses</option>
              {REVIEW_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <select
              value={ratingFilter}
              onChange={e => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              style={mobileSelectStyle}
            >
              <option value="all">All ratings</option>
              {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} star{n !== 1 ? 's' : ''}</option>)}
            </select>
          </div>
          <div style={{ marginTop: 8 }}>
            <ReviewImport onImport={importReviews} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
          {loading && <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {search || statusFilter !== 'all' || ratingFilter !== 'all'
                ? 'No reviews match your filters.'
                : 'No reviews yet. Tap New to add your first book review.'}
            </div>
          )}
          {grouped.map(([monthKey, monthReviews]) => (
            <div key={monthKey}>
              <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '8px 2px 6px' }}>
                {formatMonthKey(monthKey)}
              </div>
              {monthReviews.map(review => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  isActive={false}
                  onClick={() => handleSelect(review)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

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
          <div style={{ marginTop: 7 }}>
            <ReviewImport onImport={importReviews} />
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
            review={isNew ? newDefaults : activeReview}
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

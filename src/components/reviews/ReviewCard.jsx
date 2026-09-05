import { StarDots } from './StarRating'
import { CoverThumb } from './CoverUpload'
import { REVIEW_STATUSES } from '../../hooks/useBookReviews'
import { formatEntryDate, wordCountLabel } from '../../lib/journalUtils'

export default function ReviewCard({ review, isActive, onClick }) {
  const status = REVIEW_STATUSES.find(s => s.id === review.status)
  const preview = (review.script || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      aria-selected={isActive}
      style={{
        background: 'var(--surface)',
        border: `${isActive ? '1px' : '0.5px'} solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding: '9px 11px',
        marginBottom: 6,
        cursor: 'pointer',
        transition: 'border-color 0.1s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)' }}>
          {formatEntryDate(review.review_date)}
        </span>
        {status && (
          <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 10, background: status.bg, color: status.text, fontWeight: 500 }}>
            {status.label}
          </span>
        )}
        {review.rating && (
          <span style={{ marginLeft: 'auto' }}><StarDots value={review.rating} /></span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <CoverThumb coverPath={review.cover_path} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {review.title && (
            <div style={{
              fontSize: 12, fontWeight: 500, color: 'var(--text-primary)',
              marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {review.title}
            </div>
          )}

          {(review.author || review.series_position) && (
            <div style={{
              fontSize: 10, color: 'var(--text-secondary)', marginBottom: 2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {[review.author, review.series_position].filter(Boolean).join(' · ')}
            </div>
          )}

          {preview && (
            <div style={{
              fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4,
              marginBottom: 5, overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {preview}
            </div>
          )}
        </div>
      </div>

      {review.script && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {wordCountLabel(review.script)}
          </span>
        </div>
      )}
    </div>
  )
}

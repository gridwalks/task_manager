import { Star } from 'lucide-react'

const RATING_LABELS = ['', 'DNF vibes', 'Not for me', 'Liked it', 'Loved it', 'Obsessed']

export default function StarRating({ value, onChange, size = 'md' }) {
  const starSize = size === 'sm' ? 14 : 18

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Rating</span>
      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            title={RATING_LABELS[n]}
            aria-label={`${n} star${n !== 1 ? 's' : ''} — ${RATING_LABELS[n]}`}
            aria-pressed={value === n}
            onClick={() => onChange(value === n ? null : n)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.1s',
            }}
          >
            <Star
              size={starSize}
              fill={n <= (value || 0) ? '#D9A404' : 'transparent'}
              color={n <= (value || 0) ? '#D9A404' : 'var(--border-mid)'}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export function StarDots({ value, max = 5 }) {
  return (
    <div style={{ display: 'flex', gap: 1, alignItems: 'center' }} title={value ? `Rating: ${value}/5 — ${RATING_LABELS[value]}` : 'No rating yet'}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={9}
          fill={i < (value || 0) ? '#D9A404' : 'transparent'}
          color={i < (value || 0) ? '#D9A404' : 'var(--border-mid)'}
        />
      ))}
    </div>
  )
}

import { Flame } from 'lucide-react'

const SPICE_LABELS = ['', 'Clean', 'Mild', 'Warm', 'Spicy', 'Scorching']
const SPICE_COLOR = '#E8590C'

export default function SpiceRating({ value, onChange, size = 'md' }) {
  const flameSize = size === 'sm' ? 14 : 18

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Spice</span>
      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            title={SPICE_LABELS[n]}
            aria-label={`Spice level ${n} — ${SPICE_LABELS[n]}`}
            aria-pressed={value === n}
            onClick={() => onChange(value === n ? null : n)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.1s',
            }}
          >
            <Flame
              size={flameSize}
              fill={n <= (value || 0) ? SPICE_COLOR : 'transparent'}
              color={n <= (value || 0) ? SPICE_COLOR : 'var(--border-mid)'}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export function SpiceDots({ value, max = 5 }) {
  return (
    <div style={{ display: 'flex', gap: 1, alignItems: 'center' }} title={value ? `Spice: ${value}/5 — ${SPICE_LABELS[value]}` : 'No spice level set'}>
      {Array.from({ length: max }, (_, i) => (
        <Flame
          key={i}
          size={9}
          fill={i < (value || 0) ? SPICE_COLOR : 'transparent'}
          color={i < (value || 0) ? SPICE_COLOR : 'var(--border-mid)'}
        />
      ))}
    </div>
  )
}

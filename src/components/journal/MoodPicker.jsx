const MOOD_LABELS = ['', 'Low', 'Tired', 'Neutral', 'Good', 'Great']

export default function MoodPicker({ value, onChange, size = 'md' }) {
  const btnSize = size === 'sm' ? 20 : 24

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Mood</span>
      <div style={{ display: 'flex', gap: 3 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            title={MOOD_LABELS[n]}
            aria-label={`Mood ${n} — ${MOOD_LABELS[n]}`}
            aria-pressed={value === n}
            onClick={() => onChange(value === n ? null : n)}
            style={{
              width: btnSize, height: btnSize, borderRadius: '50%',
              border: `0.5px solid ${value === n ? '#4F52D9' : 'var(--border-mid)'}`,
              background: value === n ? '#4F52D9' : 'transparent',
              color: value === n ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.1s',
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

export function MoodDots({ value, max = 5 }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }} title={value ? `Mood: ${MOOD_LABELS[value]}` : 'No mood recorded'}>
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: i < (value || 0) ? '#4F52D9' : 'var(--border-mid)',
          }}
        />
      ))}
    </div>
  )
}

import { Plus } from 'lucide-react'

export default function TagPicker({ journalTags, selected, onChange, onManage }) {
  const toggle = (id) => {
    if (selected.includes(id)) onChange(selected.filter(t => t !== id))
    else onChange([...selected, id])
  }

  return (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
      {journalTags.map(tag => {
        const on = selected.includes(tag.id)
        return (
          <button
            key={tag.id}
            onClick={() => toggle(tag.id)}
            aria-pressed={on}
            style={{
              fontSize: 11, padding: '2px 9px', borderRadius: 20,
              border: `0.5px solid ${on ? tag.text + '88' : 'var(--border-mid)'}`,
              background: on ? tag.bg : 'transparent',
              color: on ? tag.text : 'var(--text-muted)',
              cursor: 'pointer', fontFamily: 'var(--font)',
              fontWeight: on ? 500 : 400,
              transition: 'all 0.1s',
            }}
          >
            {tag.label}
          </button>
        )
      })}
      {onManage && (
        <button
          onClick={onManage}
          aria-label="Manage tags"
          title="Manage tags"
          style={{
            width: 22, height: 22, borderRadius: '50%',
            border: '0.5px solid var(--border-mid)', background: 'transparent',
            color: 'var(--accent)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Plus size={11} />
        </button>
      )}
    </div>
  )
}

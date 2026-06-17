import { Lock } from 'lucide-react'
import { MoodDots } from './MoodPicker'
import { ENTRY_TYPES } from '../../hooks/useJournalConfig'
import { formatEntryDate, wordCountLabel } from '../../lib/journalUtils'

export default function EntryCard({ entry, journalTags, isActive, onClick }) {
  const type = ENTRY_TYPES.find(t => t.id === entry.entry_type)
  const tags = (entry.tags || []).map(id => journalTags.find(t => t.id === id)).filter(Boolean)
  const preview = (entry.body || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

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
          {formatEntryDate(entry.entry_date)}
        </span>
        {type && (
          <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 10, background: type.bg, color: type.text, fontWeight: 500 }}>
            {type.label}
          </span>
        )}
        {entry.mood && <MoodDots value={entry.mood} />}
        {entry.is_private && (
          <Lock size={10} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
        )}
      </div>

      {entry.title && (
        <div style={{
          fontSize: 12, fontWeight: 500, color: 'var(--text-primary)',
          marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {entry.title}
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        {tags.map(tag => (
          <span key={tag.id} style={{
            fontSize: 9, padding: '1px 6px', borderRadius: 10,
            background: tag.bg, color: tag.text, fontWeight: 500,
          }}>
            {tag.label}
          </span>
        ))}
        {entry.body && (
          <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {wordCountLabel(entry.body)}
          </span>
        )}
      </div>
    </div>
  )
}

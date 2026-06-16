import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { useJournal } from '../hooks/useJournal'
import { useJournalConfig, ENTRY_TYPES } from '../hooks/useJournalConfig'
import { useTasks } from '../hooks/useTasks'
import EntryCard from '../components/journal/EntryCard'
import EntryComposer from '../components/journal/EntryComposer'
import { todayISO, groupEntriesByMonth, formatMonthKey } from '../lib/journalUtils'

const EMPTY_ENTRY = {
  title: '', body: '', entry_date: todayISO(),
  entry_type: 'reflection', mood: null, tags: [],
  linked_task_id: null, is_private: false,
}

export default function JournalPage() {
  const { entries, loading, addEntry, updateEntry, deleteEntry } = useJournal()
  const { journalTags, saveJournalTags } = useJournalConfig()
  const { tasks } = useTasks()

  const [activeId, setActiveId] = useState(null)
  const [isNew, setIsNew] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('all')

  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (typeFilter !== 'all' && e.entry_type !== typeFilter) return false
      if (tagFilter !== 'all' && !(e.tags || []).includes(tagFilter)) return false
      if (search) {
        const q = search.toLowerCase()
        return (e.title || '').toLowerCase().includes(q) || (e.body || '').toLowerCase().includes(q)
      }
      return true
    })
  }, [entries, typeFilter, tagFilter, search])

  const grouped = groupEntriesByMonth(filtered)
  const activeEntry = isNew ? null : entries.find(e => e.id === activeId)

  const handleNew = () => { setIsNew(true); setActiveId(null) }
  const handleSelect = (entry) => { setActiveId(entry.id); setIsNew(false) }

  const handleSave = async (form) => {
    if (isNew) {
      const created = await addEntry(form)
      setActiveId(created.id)
      setIsNew(false)
    } else {
      await updateEntry(activeId, form)
    }
  }

  const handleDelete = async (id) => {
    await deleteEntry(id)
    setActiveId(null)
    setIsNew(false)
  }

  const entryCounts = useMemo(() => {
    const counts = {}
    ENTRY_TYPES.forEach(t => { counts[t.id] = entries.filter(e => e.entry_type === t.id).length })
    counts.all = entries.length
    return counts
  }, [entries])

  const tagCounts = useMemo(() => {
    const counts = {}
    journalTags.forEach(t => { counts[t.id] = entries.filter(e => (e.tags || []).includes(t.id)).length })
    return counts
  }, [entries, journalTags])

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Type + tag filter panel */}
      <div style={{
        width: 180, flexShrink: 0, background: 'var(--surface-2)',
        borderRight: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column',
        padding: '12px 0', overflowY: 'auto',
      }}>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '0 14px', marginBottom: 4 }}>Type</div>
        {[{ id: 'all', label: 'All entries' }, ...ENTRY_TYPES].map(t => (
          <button key={t.id} onClick={() => setTypeFilter(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '5px 14px',
            background: typeFilter === t.id ? 'var(--surface)' : 'transparent',
            border: 'none', cursor: 'pointer', fontSize: 12,
            color: typeFilter === t.id ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: typeFilter === t.id ? 500 : 400,
            fontFamily: 'var(--font)', width: '100%', textAlign: 'left',
            transition: 'background 0.1s',
          }}>
            <span style={{ flex: 1 }}>{t.label}</span>
            <span style={{
              fontSize: 9, padding: '1px 5px', borderRadius: 8,
              background: 'var(--surface)', border: '0.5px solid var(--border)',
              color: 'var(--text-muted)',
            }}>
              {entryCounts[t.id] || 0}
            </span>
          </button>
        ))}

        <div style={{ height: '0.5px', background: 'var(--border)', margin: '10px 14px' }} />
        <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '0 14px', marginBottom: 4 }}>Tags</div>
        <button onClick={() => setTagFilter('all')} style={{
          display: 'flex', alignItems: 'center', padding: '5px 14px',
          background: tagFilter === 'all' ? 'var(--surface)' : 'transparent',
          border: 'none', cursor: 'pointer', fontSize: 12,
          color: tagFilter === 'all' ? 'var(--accent)' : 'var(--text-secondary)',
          fontFamily: 'var(--font)', width: '100%', textAlign: 'left',
        }}>
          All tags
        </button>
        {journalTags.map(tag => (
          <button key={tag.id} onClick={() => setTagFilter(tag.id === tagFilter ? 'all' : tag.id)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '5px 14px',
            background: tagFilter === tag.id ? 'var(--surface)' : 'transparent',
            border: 'none', cursor: 'pointer', fontSize: 12,
            color: tagFilter === tag.id ? 'var(--accent)' : 'var(--text-secondary)',
            fontFamily: 'var(--font)', width: '100%', textAlign: 'left',
            transition: 'background 0.1s',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: tag.text, flexShrink: 0 }} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tag.label}</span>
            <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{tagCounts[tag.id] || 0}</span>
          </button>
        ))}
      </div>

      {/* Entry list */}
      <div style={{ width: 260, flexShrink: 0, borderRight: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px 10px 6px', borderBottom: '0.5px solid var(--border)', background: 'var(--surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Journal</span>
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
              placeholder="Search entries…"
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
              {search || typeFilter !== 'all' || tagFilter !== 'all'
                ? 'No entries match your filters.'
                : 'No entries yet.\nClick New to write your first entry.'}
            </div>
          )}
          {grouped.map(([monthKey, monthEntries]) => (
            <div key={monthKey}>
              <div style={{ fontSize: 9, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '6px 2px 4px', marginTop: 4 }}>
                {formatMonthKey(monthKey)}
              </div>
              {monthEntries.map(entry => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  journalTags={journalTags}
                  isActive={!isNew && activeId === entry.id}
                  onClick={() => handleSelect(entry)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Composer */}
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', background: 'var(--surface)' }}>
        {(isNew || activeEntry) ? (
          <EntryComposer
            key={isNew ? 'new' : activeId}
            entry={isNew ? EMPTY_ENTRY : activeEntry}
            journalTags={journalTags}
            tasks={tasks}
            onSave={handleSave}
            onDelete={handleDelete}
            onSaveJournalTags={saveJournalTags}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: 10 }}>
            <div style={{ fontSize: 13 }}>Select an entry or</div>
            <button onClick={handleNew} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px',
              background: 'var(--accent)', color: '#fff', border: 'none',
              borderRadius: 'var(--radius)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)',
            }}>
              <Plus size={12} /> Write a new entry
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

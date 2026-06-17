import { useMemo, useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { useConfig } from '../hooks/useConfig'

// ── helpers ──────────────────────────────────────────────────
function todayISO() { return new Date().toISOString().split('T')[0] }

function formatHeader() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatDueLabel(dateStr) {
  if (!dateStr) return null
  const today = todayISO()
  if (dateStr === today) return { label: 'DUE TODAY', urgent: true }
  const d = new Date(dateStr + 'T12:00:00')
  const t = new Date(today + 'T12:00:00')
  const diff = Math.round((d - t) / 86400000)
  if (diff < 0)  return { label: `OVERDUE ${Math.abs(diff)}D`, urgent: true, overdue: true }
  if (diff === 1) return { label: 'DUE TOMORROW', urgent: false }
  if (diff <= 7)  return { label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), urgent: false }
  return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), urgent: false }
}

function formatUpNextDate(dateStr) {
  if (!dateStr) return ''
  const today = todayISO()
  const d = new Date(dateStr + 'T12:00:00')
  const diff = Math.round((new Date(dateStr) - new Date(today)) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

const PRIORITY_ORDER = { high: 0, med: 1, low: 2, '': 3, undefined: 3 }

// ── sub-components ────────────────────────────────────────────
function SectionLabel({ children, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        {children}
      </span>
      {count != null && (
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>· {count}</span>
      )}
    </div>
  )
}

function TaskCheck({ done, onChange }) {
  return (
    <button onClick={onChange} style={{
      width: 18, height: 18, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
      border: `1.5px solid ${done ? 'var(--accent)' : 'var(--border-mid)'}`,
      background: done ? 'var(--accent)' : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.15s', marginTop: 1,
    }}>
      {done && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
    </button>
  )
}

function TagPill({ label, bg, text }) {
  if (!label) return null
  return (
    <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 8, background: bg || '#F4F3F0', color: text || '#4B5563', fontWeight: 500, letterSpacing: '0.3px' }}>
      {label.toUpperCase()}
    </span>
  )
}

// ── main ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const { tasks, updateTask } = useTasks()
  const { config, saveConfig } = useConfig()

  // Top-3 stored in config keyed by date so it auto-resets each day
  const today = todayISO()
  const storedTop3 = config.top3 || {}
  const top3Ids = storedTop3.date === today ? (storedTop3.ids || []) : []

  const setTop3Ids = async (ids) => {
    await saveConfig({ top3: { date: today, ids } })
  }

  const toggleTop3 = async (taskId) => {
    if (top3Ids.includes(taskId)) {
      await setTop3Ids(top3Ids.filter(id => id !== taskId))
    } else if (top3Ids.length < 3) {
      await setTop3Ids([...top3Ids, taskId])
    }
  }

  // Derived data
  const openTasks = useMemo(() =>
    tasks.filter(t => t.status !== 'done')
      .sort((a, b) => (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]) || (a.position - b.position)),
    [tasks]
  )

  const top3Tasks = useMemo(() =>
    top3Ids.map(id => tasks.find(t => t.id === id)).filter(Boolean),
    [top3Ids, tasks]
  )

  const upNext = useMemo(() =>
    tasks
      .filter(t => t.due_date && t.due_date >= today && t.status !== 'done')
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 6),
    [tasks, today]
  )

  const handleComplete = async (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done'
    await updateTask(task.id, { status: newStatus })
    if (newStatus === 'done') {
      await setTop3Ids(top3Ids.filter(id => id !== task.id))
    }
  }

  // Enrich with config lookups
  const tagMap  = useMemo(() => Object.fromEntries((config.tags || []).map(t => [t.id, t])), [config.tags])
  const colMap  = useMemo(() => Object.fromEntries((config.columns || []).map(c => [c.id, c])), [config.columns])

  // Slot placeholders so we always show 3 rows
  const top3Slots = [
    top3Tasks[0] || null,
    top3Tasks[1] || null,
    top3Tasks[2] || null,
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '36px 28px 60px' }}>

        {/* Date header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
            TODAY
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 300, color: 'var(--text-primary)', letterSpacing: '-0.5px', margin: 0 }}>
            {formatHeader()}
          </h1>
        </div>

        {/* ── TOP 3 ── */}
        <section style={{ marginBottom: 40 }}>
          <SectionLabel>Top 3 for Today</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {top3Slots.map((task, i) => (
              <div key={task?.id || `slot-${i}`} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '11px 0', borderBottom: '0.5px solid var(--border)',
              }}>
                <TaskCheck done={task?.status === 'done'} onChange={() => task && handleComplete(task)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {task ? (
                    <>
                      <div style={{
                        fontSize: 14, color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: task.status === 'done' ? 'line-through' : 'none',
                        fontWeight: 400, lineHeight: 1.4,
                      }}>
                        {task.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                        {tagMap[task.tag] && <TagPill label={tagMap[task.tag].label} bg={tagMap[task.tag].bg} text={tagMap[task.tag].text} />}
                        {task.due_date && (() => { const d = formatDueLabel(task.due_date); return d ? <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.4px', color: d.overdue ? '#A32D2D' : d.urgent ? '#C17A2B' : 'var(--text-muted)' }}>{d.label}</span> : null })()}
                      </div>
                    </>
                  ) : (
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>(open spot)</span>
                  )}
                </div>
                {task && (
                  <button onClick={() => toggleTop3(task.id)} title="Remove from top 3"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#C17A2B', flexShrink: 0 }}>
                    <Star size={15} fill="#C17A2B" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
            Star a task below to set it as today's top 3.
          </div>
        </section>

        {/* ── UP NEXT ── */}
        {upNext.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <SectionLabel>Up Next</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {upNext.map(task => {
                const col = colMap[task.status]
                return (
                  <div key={task.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 16,
                    padding: '10px 0', borderBottom: '0.5px solid var(--border)',
                  }}>
                    <div style={{ width: 64, flexShrink: 0, textAlign: 'right' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatUpNextDate(task.due_date)}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 400, lineHeight: 1.4 }}>
                        {task.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        {col && (
                          <span style={{ fontSize: 9, color: col.color, fontWeight: 600, letterSpacing: '0.3px' }}>
                            {col.label.toUpperCase()}
                          </span>
                        )}
                        {tagMap[task.tag] && <TagPill label={tagMap[task.tag].label} bg={tagMap[task.tag].bg} text={tagMap[task.tag].text} />}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── ALL OPEN ── */}
        <section>
          <SectionLabel count={openTasks.length}>All Open</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {openTasks.length === 0 && (
              <div style={{ padding: '20px 0', fontSize: 13, color: 'var(--text-muted)' }}>All tasks are complete 🎉</div>
            )}
            {openTasks.map(task => {
              const isTop3 = top3Ids.includes(task.id)
              const canStar = !isTop3 && top3Ids.length < 3
              const due = task.due_date ? formatDueLabel(task.due_date) : null
              const col = colMap[task.status]
              return (
                <div key={task.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '10px 0', borderBottom: '0.5px solid var(--border)',
                }}>
                  <TaskCheck done={false} onChange={() => handleComplete(task)} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 400, lineHeight: 1.4 }}>
                      {task.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                      {col && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.3px' }}>{col.label.toUpperCase()}</span>
                        </span>
                      )}
                      {tagMap[task.tag] && <TagPill label={tagMap[task.tag].label} bg={tagMap[task.tag].bg} text={tagMap[task.tag].text} />}
                      {due && (
                        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.4px', color: due.overdue ? '#A32D2D' : due.urgent ? '#C17A2B' : 'var(--text-muted)' }}>
                          {due.label}
                        </span>
                      )}
                      {task.priority === 'high' && (
                        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.4px', color: '#A32D2D' }}>HIGH</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => (isTop3 || canStar) && toggleTop3(task.id)}
                    title={isTop3 ? 'Remove from top 3' : canStar ? 'Add to top 3' : 'Top 3 is full'}
                    style={{
                      background: 'none', border: 'none', cursor: isTop3 || canStar ? 'pointer' : 'default',
                      padding: 2, flexShrink: 0, color: isTop3 ? '#C17A2B' : 'var(--border-mid)',
                      transition: 'color 0.1s',
                    }}
                    onMouseEnter={e => { if (canStar) e.currentTarget.style.color = '#C17A2B' }}
                    onMouseLeave={e => { if (!isTop3) e.currentTarget.style.color = 'var(--border-mid)' }}
                  >
                    <Star size={14} fill={isTop3 ? '#C17A2B' : 'none'} />
                  </button>
                </div>
              )
            })}
          </div>
        </section>

      </div>
    </div>
  )
}

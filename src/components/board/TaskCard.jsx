import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function dueBadge(due, status) {
  if (!due || status === 'done') return null
  const diff = Math.ceil((new Date(due) - new Date()) / 86400000)
  const cls = diff < 0 ? 'late' : diff <= 3 ? 'warn' : 'ok'
  const label = due.slice(5).replace('-', '/')
  return <span className={`due-badge due-${cls}`}>{label}</span>
}

function priBadge(p) {
  if (!p) return null
  const m = { high: ['pri-high', 'High'], med: ['pri-med', 'Med'], low: ['pri-low', 'Low'] }
  if (!m[p]) return null
  return <span className={`priority-badge ${m[p][0]}`}>{m[p][1]}</span>
}

export default function TaskCard({ task, colColor, assignee, tag, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card ${task.status}`}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <div className="card-rail" style={{ background: colColor }} />
      <div className="card-body">
        <div className="cid">{task.short_id || task.id.slice(0, 8)}</div>
        <div className="ctitle">{task.title}</div>
        <div className="cmeta">
          {tag && <span className="ctag" style={{ background: tag.bg, color: tag.text }}>{tag.label}</span>}
          {dueBadge(task.due_date, task.status)}
          {priBadge(task.priority)}
          {assignee && (
            <span className="av" style={{ background: assignee.bg, color: assignee.text, marginLeft: 'auto' }}>
              {assignee.initials}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

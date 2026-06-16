import { useState, useMemo } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners,
} from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { useConfig } from '../hooks/useConfig'
import Column from '../components/board/Column'
import TaskCard from '../components/board/TaskCard'
import TaskModal from '../components/board/TaskModal'
import AddTaskModal from '../components/board/AddTaskModal'

export default function BoardPage() {
  const { tasks, loading, addTask, updateTask, deleteTask } = useTasks()
  const { config } = useConfig()

  const [activeTask, setActiveTask] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [addingToCol, setAddingToCol] = useState(null)
  const [tagFilter, setTagFilter] = useState('all')
  const [assFilter, setAssFilter] = useState('all')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const tasksByCol = useMemo(() => {
    const map = {}
    config.columns.forEach(c => { map[c.id] = [] })
    tasks
      .filter(t => (tagFilter === 'all' || t.tag === tagFilter) && (assFilter === 'all' || t.assignee_id === assFilter))
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .forEach(t => { if (map[t.status]) map[t.status].push(t) })
    return map
  }, [tasks, config.columns, tagFilter, assFilter])

  const handleDragStart = ({ active }) => {
    setActiveTask(tasks.find(t => t.id === active.id) || null)
  }

  const handleDragEnd = async ({ active, over }) => {
    setActiveTask(null)
    if (!over) return
    const fromTask = tasks.find(t => t.id === active.id)
    if (!fromTask) return
    const toCol = config.columns.find(c => c.id === over.id)
    const toTask = tasks.find(t => t.id === over.id)
    const newStatus = toCol ? toCol.id : (toTask ? toTask.status : fromTask.status)
    if (newStatus !== fromTask.status || (toTask && toTask.id !== fromTask.id)) {
      await updateTask(fromTask.id, { status: newStatus })
    }
  }

  const accentStyle = { '--accent': config.accent }

  return (
    <div style={accentStyle}>
      <header className="topbar">
        <span className="topbar-page-title">Board</span>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={() => setAddingToCol(config.columns[0]?.id)}>
            <Plus size={12} /> New task
          </button>
        </div>
      </header>

      <div className="filter-bar">
        <span className="filter-lbl">Tag:</span>
        <button className={`fp${tagFilter === 'all' ? ' fp-on' : ''}`} style={tagFilter === 'all' ? { background: config.accent, borderColor: config.accent, color: '#fff' } : {}} onClick={() => setTagFilter('all')}>All</button>
        {config.tags.map(t => (
          <button key={t.id} className={`fp${tagFilter === t.id ? ' fp-on' : ''}`} style={tagFilter === t.id ? { background: config.accent, borderColor: config.accent, color: '#fff' } : {}} onClick={() => setTagFilter(t.id)}>{t.label}</button>
        ))}
        <span className="vsep" />
        <span className="filter-lbl">Assignee:</span>
        <button className={`fp${assFilter === 'all' ? ' fp-on' : ''}`} style={assFilter === 'all' ? { background: config.accent, borderColor: config.accent, color: '#fff' } : {}} onClick={() => setAssFilter('all')}>All</button>
        {config.assignees.map(a => (
          <button key={a.id} className={`fp${assFilter === a.id ? ' fp-on' : ''}`} style={assFilter === a.id ? { background: config.accent, borderColor: config.accent, color: '#fff' } : {}} onClick={() => setAssFilter(a.id)}>{a.initials}</button>
        ))}
      </div>

      {loading ? (
        <div className="board-loading">Loading tasks…</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <main className="board">
            {config.columns.map(col => (
              <Column
                key={col.id}
                col={col}
                tasks={tasksByCol[col.id] || []}
                config={config}
                onCardClick={setEditingTask}
                onAddClick={setAddingToCol}
              />
            ))}
          </main>
          <DragOverlay>
            {activeTask && (
              <TaskCard
                task={activeTask}
                colColor={config.columns.find(c => c.id === activeTask.status)?.color || '#ccc'}
                tag={config.tags.find(t => t.id === activeTask.tag)}
                assignee={config.assignees.find(a => a.id === activeTask.assignee_id)}
              />
            )}
          </DragOverlay>
        </DndContext>
      )}

      {editingTask && (
        <TaskModal
          task={editingTask}
          config={config}
          onUpdate={async (id, updates) => { await updateTask(id, updates); setEditingTask(t => ({ ...t, ...updates })) }}
          onDelete={deleteTask}
          onClose={() => setEditingTask(null)}
        />
      )}

      {addingToCol && (
        <AddTaskModal
          defaultStatus={addingToCol}
          config={config}
          onAdd={addTask}
          onClose={() => setAddingToCol(null)}
        />
      )}
    </div>
  )
}

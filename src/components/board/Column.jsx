import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TaskCard from './TaskCard'
import { Plus } from 'lucide-react'

export default function Column({ col, tasks, config, onCardClick, onAddClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })

  const getTag = (tagId) => config.tags.find(t => t.id === tagId)
  const getAssignee = (assId) => config.assignees.find(a => a.id === assId)

  return (
    <div className={`col${isOver ? ' col-over' : ''}`} style={{ '--col-color': col.color }}>
      <div className="col-hdr">
        <span className="col-rail" style={{ background: col.color }} />
        <span className="col-title">{col.label}</span>
        <span className="col-cnt">{tasks.length}</span>
      </div>

      <div ref={setNodeRef} className="col-drop-zone">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="tasks">
            {tasks.length === 0 && (
              <div className="empty-col">Drop tasks here</div>
            )}
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                colColor={col.color}
                tag={getTag(task.tag)}
                assignee={getAssignee(task.assignee_id)}
                onClick={() => onCardClick(task)}
              />
            ))}
          </div>
        </SortableContext>
      </div>

      <button className="add-task-btn" onClick={() => onAddClick(col.id)}>
        <Plus size={12} />
        Add task
      </button>
    </div>
  )
}

'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AgentBadge } from './AgentBadge'
import { useRouter } from 'next/navigation'

interface Task {
  id: string
  title: string
  description?: string
  priority: string
  status: string
  agentType?: string
  aiReasoning?: string
}

interface TaskCardProps {
  task: Task
  onUpdate: (updates: Partial<Task>) => void
}

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
}

export function TaskCard({ task, onUpdate }: TaskCardProps) {
  const router = useRouter()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleClick = (e: React.MouseEvent) => {
    // Only navigate if not currently dragging
    if (!isDragging) {
      e.stopPropagation()
      router.push(`/tasks/${task.id}`)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`relative bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50 cursor-move' : 'cursor-pointer hover:border-blue-300'
      }`}
      onClick={handleClick}
    >
      {/* Drag Handle */}
      <div
        {...listeners}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 cursor-move"
        onClick={(e) => e.stopPropagation()}
      >
        ⋮⋮
      </div>

      <div className="space-y-2">
        <h4 className="font-medium text-gray-900 pr-8">{task.title}</h4>
        {task.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
        )}
        {task.aiReasoning && (
          <p className="text-xs text-gray-500 italic border-l-2 border-blue-300 pl-2">
            {task.aiReasoning}
          </p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-xs px-2 py-1 rounded ${
              priorityColors[task.priority as keyof typeof priorityColors] ||
              priorityColors.medium
            }`}
          >
            {task.priority}
          </span>
          {task.agentType && <AgentBadge agentType={task.agentType} />}
        </div>
      </div>
    </div>
  )
}

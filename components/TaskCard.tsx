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
  low: 'bg-green-900/30 text-green-400',
  medium: 'bg-yellow-900/30 text-yellow-400',
  high: 'bg-red-900/30 text-red-400',
}

export function TaskCard({ task }: TaskCardProps) {
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
      className={`relative bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md hover:shadow-blue-500/10 transition-shadow ${
        isDragging ? 'opacity-50 cursor-move' : 'cursor-pointer hover:border-blue-500'
      }`}
      onClick={handleClick}
    >
      {/* Drag Handle */}
      <div
        {...listeners}
        className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-300 cursor-move"
        onClick={(e) => e.stopPropagation()}
      >
        ⋮⋮
      </div>

      <div className="space-y-2">
        <h4 className="font-medium text-white pr-8">{task.title}</h4>
        {task.description && (
          <p className="text-sm text-gray-300 line-clamp-2">{task.description}</p>
        )}
        {task.aiReasoning && (
          <p className="text-xs text-gray-400 italic border-l-2 border-blue-500 pl-2">
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

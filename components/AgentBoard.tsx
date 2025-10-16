'use client'

import { KanbanBoard } from './KanbanBoard'

interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done'
  priority: string
  projectId: string
  order: number
  agentType?: string
  aiReasoning?: string
}

interface AgentBoardProps {
  agentType: string
  agentName: string
  agentIcon: string
  tasks: Task[]
  projectId: string
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
}

export function AgentBoard({
  agentType,
  agentName,
  agentIcon,
  tasks,
  projectId,
  onTaskUpdate,
}: AgentBoardProps) {
  // Filter tasks for this agent
  const agentTasks = tasks.filter(task => task.agentType === agentType)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{agentIcon}</span>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{agentName}</h2>
          <p className="text-sm text-gray-600">{agentTasks.length} tasks</p>
        </div>
      </div>
      <KanbanBoard
        tasks={agentTasks}
        projectId={projectId}
        onTaskUpdate={onTaskUpdate}
      />
    </div>
  )
}

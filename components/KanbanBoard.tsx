'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'

export interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done'
  priority: string
  projectId: string
  order: number
  tags?: string
}

interface Repository {
  name: string
  path: string
  repoUrl?: string
  description?: string
}

interface KanbanBoardProps {
  tasks: Task[]
  projectId: string
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  repositories?: Repository[]
}

const columns = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
]

export function KanbanBoard({ tasks, onTaskUpdate, repositories = [] }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [repoFilter, setRepoFilter] = useState<string[]>([])

  const hasMultipleRepos = repositories.length > 1

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
    const overId = over.id as string

    // Check if dropped on a column
    const targetColumn = columns.find(col => col.id === overId)
    if (targetColumn) {
      onTaskUpdate(taskId, { status: targetColumn.id as Task['status'] })
    }
  }

  // Filter tasks by selected repositories
  const filteredTasks = tasks.filter(task => {
    if (repoFilter.length === 0) return true

    try {
      const taskTags = task.tags ? JSON.parse(task.tags) : []
      return repoFilter.some(repo => taskTags.includes(repo))
    } catch {
      return false
    }
  })

  const getTasksByStatus = (status: string) => {
    return filteredTasks.filter(task => task.status === status)
  }

  const toggleRepoFilter = (repo: string) => {
    setRepoFilter(prev =>
      prev.includes(repo)
        ? prev.filter(r => r !== repo)
        : [...prev, repo]
    )
  }

  return (
    <div className="space-y-4">
      {/* Repository Filter */}
      {hasMultipleRepos && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-400">Filter by repository:</span>
            <div className="flex flex-wrap gap-2">
              {repositories.map(repo => (
                <button
                  key={repo.name}
                  onClick={() => toggleRepoFilter(repo.name)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    repoFilter.includes(repo.name)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  📦 {repo.name}
                </button>
              ))}
              {repoFilter.length > 0 && (
                <button
                  onClick={() => setRepoFilter([])}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-red-900/30 text-red-400 hover:bg-red-900/50"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 h-full overflow-x-auto pb-4">
        {columns.map(column => {
          const columnTasks = getTasksByStatus(column.id)
          return (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              count={columnTasks.length}
            >
              <SortableContext
                items={columnTasks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {columnTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onUpdate={(updates) => onTaskUpdate(task.id, updates)}
                    repositories={repositories}
                  />
                ))}
              </SortableContext>
            </KanbanColumn>
          )
        })}
      </div>

        <DragOverlay>
          {activeTask ? (
            <div className="opacity-80">
              <TaskCard task={activeTask} onUpdate={() => {}} repositories={repositories} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

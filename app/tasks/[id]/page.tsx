'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AgentBadge } from '@/components/AgentBadge'

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  agentType?: string
  aiReasoning?: string
  githubPrUrl?: string
  githubIssueUrl?: string
  dueDate?: string
  createdAt: string
  updatedAt: string
  project: {
    id: string
    name: string
    description?: string
  }
}

const statusOptions = ['todo', 'in_progress', 'done']
const priorityOptions = ['low', 'medium', 'high']

const statusColors = {
  todo: 'bg-gray-700 text-gray-300',
  in_progress: 'bg-yellow-900/30 text-yellow-400',
  done: 'bg-green-900/30 text-green-400',
}

const priorityColors = {
  low: 'bg-green-900/30 text-green-400',
  medium: 'bg-yellow-900/30 text-yellow-400',
  high: 'bg-red-900/30 text-red-400',
}

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Task>>({})

  useEffect(() => {
    loadTask()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  async function loadTask() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/tasks/${params.id}`)
      if (!res.ok) {
        throw new Error('Task not found')
      }
      const data = await res.json()
      setTask(data)
      setEditData({
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load task')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!task) return

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })

      if (res.ok) {
        const updated = await res.json()
        setTask(updated)
        setIsEditing(false)
      }
    } catch (_err) {
      alert('Failed to update task')
    }
  }

  async function handleDelete() {
    if (!task) return
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push(`/projects/${task.project.id}`)
      }
    } catch (_err) {
      alert('Failed to delete task')
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-400">Loading task...</p>
        </div>
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-2">Task not found</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            href="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Projects
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <div className="space-y-2">
            <Link
              href={`/projects/${task.project.id}`}
              className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
            >
              ← Back to {task.project.name}
            </Link>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                ✏️ Edit
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditData({
                      title: task.title,
                      description: task.description,
                      status: task.status,
                      priority: task.priority,
                    })
                  }}
                  className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  💾 Save
                </button>
              </>
            )}
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              🗑️ Delete
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 mb-6">
          {/* Title */}
          {isEditing ? (
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="w-full text-3xl font-bold text-white mb-6 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          ) : (
            <h1 className="text-3xl font-bold text-white mb-6">{task.title}</h1>
          )}

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {isEditing ? (
              <>
                <select
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  className="px-3 py-1 rounded-lg border border-gray-600 bg-gray-700 text-white text-sm font-medium"
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ')}
                    </option>
                  ))}
                </select>
                <select
                  value={editData.priority}
                  onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                  className="px-3 py-1 rounded-lg border border-gray-600 bg-gray-700 text-white text-sm font-medium"
                >
                  {priorityOptions.map(priority => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${statusColors[task.status as keyof typeof statusColors]}`}>
                  {task.status.replace('_', ' ').toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                  {task.priority.toUpperCase()} PRIORITY
                </span>
              </>
            )}
            {task.agentType && <AgentBadge agentType={task.agentType} />}
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Description</h3>
            {isEditing ? (
              <textarea
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                placeholder="Add a description..."
              />
            ) : task.description ? (
              <p className="text-gray-200 whitespace-pre-wrap">{task.description}</p>
            ) : (
              <p className="text-gray-500 italic">No description provided</p>
            )}
          </div>

          {/* AI Reasoning */}
          {task.aiReasoning && (
            <div className="mb-6 bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded">
              <h3 className="text-sm font-semibold text-blue-400 mb-2">🤖 AI Reasoning</h3>
              <p className="text-blue-200 text-sm">{task.aiReasoning}</p>
            </div>
          )}

          {/* GitHub Links */}
          {(task.githubPrUrl || task.githubIssueUrl) && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">GitHub Links</h3>
              <div className="space-y-2">
                {task.githubPrUrl && (
                  <a
                    href={task.githubPrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <span>🔗</span>
                    <span>Pull Request</span>
                  </a>
                )}
                {task.githubIssueUrl && (
                  <a
                    href={task.githubIssueUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <span>🔗</span>
                    <span>Issue</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-6 border-t border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Task Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2 text-gray-200">{formatDate(task.createdAt)}</span>
              </div>
              <div>
                <span className="text-gray-500">Last Updated:</span>
                <span className="ml-2 text-gray-200">{formatDate(task.updatedAt)}</span>
              </div>
              {task.dueDate && (
                <div>
                  <span className="text-gray-500">Due Date:</span>
                  <span className="ml-2 text-gray-200">{formatDate(task.dueDate)}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Project:</span>
                <Link
                  href={`/projects/${task.project.id}`}
                  className="ml-2 text-blue-400 hover:text-blue-300"
                >
                  {task.project.name}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Project Info Card */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Part of {task.project.name}</h3>
          {task.project.description && (
            <p className="text-gray-300 mb-4">{task.project.description}</p>
          )}
          <Link
            href={`/projects/${task.project.id}`}
            className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
          >
            View all tasks in this project →
          </Link>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Agent {
  id: string
  type: string
  name: string
  icon: string
  description: string
  systemPrompt: string
  taskCategories: string
  isDefault: boolean
  isActive: boolean
}

interface Project {
  id: string
  name: string
}

export default function ProjectAgentsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    type: '',
    name: '',
    icon: '🤖',
    description: '',
    systemPrompt: '',
    taskCategories: [] as string[],
  })

  useEffect(() => {
    if (!projectId) return
    loadProject()
    loadAgents()
  }, [projectId])

  const loadProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      const data = await res.json()
      setProject(data)
    } catch (error) {
      console.error('Failed to load project:', error)
    }
  }

  const loadAgents = async () => {
    try {
      const res = await fetch(`/api/agents?projectId=${projectId}`)
      const data = await res.json()
      setAgents(data)
    } catch (error) {
      console.error('Failed to load agents:', error)
    }
  }

  const handleCreate = async () => {
    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, projectId }),
    })

    if (res.ok) {
      await loadAgents()
      setIsCreating(false)
      resetForm()
    } else {
      const error = await res.json()
      alert(error.error || 'Failed to create agent')
    }
  }

  const handleUpdate = async (agentId: string) => {
    const res = await fetch(`/api/agents/${agentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    if (res.ok) {
      await loadAgents()
      setEditingAgent(null)
      resetForm()
    } else {
      alert('Failed to update agent')
    }
  }

  const handleToggleActive = async (agent: Agent) => {
    const res = await fetch(`/api/agents/${agent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !agent.isActive }),
    })

    if (res.ok) {
      await loadAgents()
    }
  }

  const handleDelete = async (agent: Agent) => {
    if (!confirm(`Are you sure you want to delete "${agent.name}"?`)) {
      return
    }

    const res = await fetch(`/api/agents/${agent.id}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      await loadAgents()
    } else {
      const error = await res.json()
      alert(error.error || 'Failed to delete agent')
    }
  }

  const startEdit = (agent: Agent) => {
    setEditingAgent(agent)
    setFormData({
      type: agent.type,
      name: agent.name,
      icon: agent.icon,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
      taskCategories: JSON.parse(agent.taskCategories),
    })
    setIsCreating(false)
  }

  const resetForm = () => {
    setFormData({
      type: '',
      name: '',
      icon: '🤖',
      description: '',
      systemPrompt: '',
      taskCategories: [],
    })
  }

  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/projects/${projectId}`)}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                ←
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-white">
                  🤖 Agents
                </h1>
                {project && (
                  <p className="text-sm text-gray-400">{project.name}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setIsCreating(true)
                setEditingAgent(null)
                resetForm()
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + New Agent
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        {/* Create/Edit Form */}
        {(isCreating || editingAgent) && (
          <div className="mb-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">
              {editingAgent ? 'Edit Agent' : 'Create New Agent'}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Type (slug)
                  </label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder:text-gray-400"
                    placeholder="marketing, technical, custom-agent"
                    disabled={editingAgent?.isDefault}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Icon
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder:text-gray-400"
                    placeholder="🤖"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder:text-gray-400"
                  placeholder="Agent Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder:text-gray-400"
                  rows={2}
                  placeholder="Brief description of what this agent does"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  System Prompt
                </label>
                <textarea
                  value={formData.systemPrompt}
                  onChange={(e) =>
                    setFormData({ ...formData, systemPrompt: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder:text-gray-400 font-mono text-sm"
                  rows={6}
                  placeholder="The system prompt that defines how this agent behaves..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Task Categories (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.taskCategories.join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      taskCategories: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder:text-gray-400"
                  placeholder="marketing, pricing, competitor-analysis"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() =>
                    editingAgent ? handleUpdate(editingAgent.id) : handleCreate()
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingAgent ? 'Update Agent' : 'Create Agent'}
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false)
                    setEditingAgent(null)
                    resetForm()
                  }}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Agents List */}
        <div className="space-y-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{agent.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {agent.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono text-gray-500 bg-gray-700 px-2 py-1 rounded">
                          {agent.type}
                        </span>
                        {agent.isDefault && (
                          <span className="text-xs px-2 py-1 bg-blue-900/30 text-blue-400 rounded">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 mb-4">{agent.description}</p>

                  <details className="text-sm">
                    <summary className="text-gray-500 cursor-pointer hover:text-gray-400">
                      View system prompt
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-900 rounded-lg text-gray-300 text-xs overflow-x-auto">
                      {agent.systemPrompt}
                    </pre>
                  </details>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleToggleActive(agent)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      agent.isActive
                        ? 'bg-green-900/30 text-green-400 hover:bg-green-900/40'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {agent.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => startEdit(agent)}
                    className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(agent)}
                    className="px-3 py-1.5 bg-red-900/30 text-red-400 rounded hover:bg-red-900/40 transition-colors text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {agents.length === 0 && (
            <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No agents configured
              </h3>
              <p className="text-gray-400 mb-6">
                Create agents to help analyze and generate tasks for this project
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

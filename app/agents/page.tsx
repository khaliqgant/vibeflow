'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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

export default function AgentsPage() {
  const router = useRouter()
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
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    const res = await fetch('/api/agents')
    const data = await res.json()
    setAgents(data)
  }

  const handleCreate = async () => {
    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    if (res.ok) {
      await fetchAgents()
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
      await fetchAgents()
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
      await fetchAgents()
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
      await fetchAgents()
    } else {
      const error = await res.json()
      alert(error.error || 'Failed to delete agent')
    }
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
  }

  const cancelEdit = () => {
    setEditingAgent(null)
    setIsCreating(false)
    resetForm()
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                ←
              </button>
              <h1 className="text-2xl font-semibold text-white">AI Agents</h1>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              + Create Custom Agent
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        {/* Create/Edit Form */}
        {(isCreating || editingAgent) && (
          <div className="mb-8 bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-6">
              {editingAgent ? 'Edit Agent' : 'Create New Agent'}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Agent Type (Slug)
                  </label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder="e.g., custom-agent"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder:text-gray-400"
                    disabled={!!editingAgent}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Agent Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Custom Strategist"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Icon (Emoji)
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="🤖"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What does this agent do?"
                  rows={2}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  System Prompt
                </label>
                <textarea
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                  placeholder="You are a [role] analyzing software projects. Your role is to..."
                  rows={8}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder:text-gray-400 font-mono text-sm"
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
                      taskCategories: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="category-1, category-2"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder:text-gray-400"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => (editingAgent ? handleUpdate(editingAgent.id) : handleCreate())}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingAgent ? 'Update Agent' : 'Create Agent'}
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-6 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Agents List */}
        <div className="grid grid-cols-1 gap-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={`bg-gray-800 rounded-xl border ${
                agent.isActive ? 'border-gray-700' : 'border-gray-700/50 opacity-60'
              } p-6`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{agent.icon}</span>
                    <h3 className="text-xl font-semibold text-white">{agent.name}</h3>
                    <span className="text-xs font-mono text-gray-500 bg-gray-700 px-2 py-1 rounded">
                      {agent.type}
                    </span>
                    {agent.isDefault && (
                      <span className="text-xs px-2 py-1 bg-blue-900/30 text-blue-400 rounded">
                        Default
                      </span>
                    )}
                    {!agent.isActive && (
                      <span className="text-xs px-2 py-1 bg-gray-700 text-gray-400 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 mb-4">{agent.description}</p>
                  <details className="text-sm">
                    <summary className="text-gray-400 cursor-pointer hover:text-gray-300 mb-2">
                      View System Prompt
                    </summary>
                    <pre className="bg-gray-900 p-3 rounded text-xs text-gray-400 overflow-x-auto whitespace-pre-wrap">
                      {agent.systemPrompt}
                    </pre>
                  </details>
                </div>
                <div className="flex items-center gap-2 ml-4">
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
        </div>
      </main>
    </div>
  )
}

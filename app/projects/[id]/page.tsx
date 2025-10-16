'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AgentBoard } from '@/components/AgentBoard'
import { KanbanBoard } from '@/components/KanbanBoard'

interface Project {
  id: string
  name: string
  description?: string
  repoUrl?: string
  githubOwner?: string
  githubRepo?: string
  aiAnalysis?: string
  techStack?: string
  lastAnalyzedAt?: string
  tasks: Task[]
  insights?: Insight[]
}

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
  githubPrUrl?: string
}

interface Insight {
  id: string
  agentType: string
  title: string
  content: string
  priority: string
}

interface PullRequest {
  number: number
  title: string
  state: string
  html_url: string
  created_at: string
  updated_at: string
  user: {
    login: string
  }
  draft: boolean
}

interface Agent {
  id: string
  type: string
  name: string
  icon: string
  description: string
  isActive: boolean
}

type ViewType = 'overview' | 'all-tasks' | 'open-prs' | string

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [activeView, setActiveView] = useState<ViewType>('overview')
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([])
  const [loadingPRs, setLoadingPRs] = useState(false)
  const [agents, setAgents] = useState<Agent[]>([])
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false)

  useEffect(() => {
    if (!projectId) return
    fetchProject()
    fetchAgents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  useEffect(() => {
    if (project?.githubOwner && project?.githubRepo) {
      fetchPullRequests()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.githubOwner, project?.githubRepo])

  const fetchProject = async () => {
    const res = await fetch(`/api/projects/${projectId}`)
    const data = await res.json()
    setProject(data)
  }

  const fetchAgents = async () => {
    try {
      const res = await fetch(`/api/agents?projectId=${projectId}`)
      if (!res.ok) {
        console.error('Agents API error:', res.status, await res.text())
        setAgents([])
        return
      }
      const data = await res.json()
      if (Array.isArray(data)) {
        setAgents(data.filter((a: Agent) => a.isActive))
      } else {
        console.error('Agents API did not return an array:', data)
        setAgents([])
      }
    } catch (error) {
      console.error('Error fetching agents:', error)
      setAgents([])
    }
  }

  const fetchPullRequests = async () => {
    setLoadingPRs(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/pull-requests`)
      if (res.ok) {
        const data = await res.json()
        setPullRequests(data)
      }
    } catch (error) {
      console.error('Error fetching pull requests:', error)
    } finally {
      setLoadingPRs(false)
    }
  }

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    await fetchProject()
  }

  const handleDeleteProject = async () => {
    if (!confirm(`Are you sure you want to delete "${project?.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })
      router.push('/')
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Failed to delete project')
    }
  }

  const handleGenerateMoreTasks = async () => {
    setIsGeneratingTasks(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/generate-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 20 }),
      })

      if (res.ok) {
        const result = await res.json()
        alert(`Generated ${result.tasksGenerated} additional tasks!`)
        await fetchProject()
      } else {
        alert('Failed to generate more tasks')
      }
    } catch (error) {
      console.error('Error generating tasks:', error)
      alert('Failed to generate more tasks')
    } finally {
      setIsGeneratingTasks(false)
    }
  }

  if (!projectId || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  const completedTasks = project.tasks.filter(t => t.status === 'done').length
  const totalTasks = project.tasks.length
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const techStack = project.techStack ? JSON.parse(project.techStack) : []

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                ←
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold text-white">{project.name}</h1>
                  {!project.lastAnalyzedAt && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-900/40 text-blue-400 text-sm font-medium rounded-full border border-blue-500/30 animate-pulse">
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Analyzing project...
                    </span>
                  )}
                </div>
                {project.githubRepo && (
                  <p className="text-sm text-gray-400">
                    {project.githubOwner}/{project.githubRepo}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDeleteProject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                🗑️ Delete
              </button>
              <button
                onClick={handleGenerateMoreTasks}
                disabled={isGeneratingTasks}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-600 transition-colors text-sm font-medium"
              >
                {isGeneratingTasks ? '✨ Generating...' : '✨ More Tasks'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <aside className="w-56 flex-shrink-0">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveView('overview')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === 'overview'
                    ? 'bg-blue-900/30 text-blue-400'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                📊 Overview
              </button>
              <button
                onClick={() => setActiveView('all-tasks')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === 'all-tasks'
                    ? 'bg-blue-900/30 text-blue-400'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                📋 All Tasks
              </button>
              {project.githubOwner && project.githubRepo && (
                <button
                  onClick={() => setActiveView('open-prs')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeView === 'open-prs'
                      ? 'bg-blue-900/30 text-blue-400'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>🔀 Open PRs</span>
                    <span className="text-xs text-gray-500">{pullRequests.length}</span>
                  </div>
                </button>
              )}
              <button
                onClick={() => router.push(`/projects/${projectId}/knowledge-base`)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
              >
                📚 Knowledge Base
              </button>
              <div className="pt-4 pb-2 px-3 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase">Agents</p>
                <button
                  onClick={() => router.push(`/projects/${projectId}/agents`)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Manage
                </button>
              </div>
              {agents.map(agent => {
                const agentTasks = project.tasks.filter(t => t.agentType === agent.type)
                return (
                  <button
                    key={agent.type}
                    onClick={() => setActiveView(agent.type)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeView === agent.type
                        ? 'bg-blue-900/30 text-blue-400'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>
                        {agent.icon} {agent.name}
                      </span>
                      <span className="text-xs text-gray-500">{agentTasks.length}</span>
                    </div>
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {activeView === 'overview' && (
              <div className="space-y-6">
                {/* Metrics */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                    <div className="text-sm text-gray-400 mb-1">Progress</div>
                    <div className="text-2xl font-semibold text-white">{completionPercentage}%</div>
                    <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                    <div className="text-sm text-gray-400 mb-1">Total Tasks</div>
                    <div className="text-2xl font-semibold text-white">{totalTasks}</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                    <div className="text-sm text-gray-400 mb-1">In Progress</div>
                    <div className="text-2xl font-semibold text-white">
                      {project.tasks.filter(t => t.status === 'in_progress').length}
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                    <div className="text-sm text-gray-400 mb-1">Completed</div>
                    <div className="text-2xl font-semibold text-white">{completedTasks}</div>
                  </div>
                </div>

                {/* Project Info */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Project Information</h2>
                  <div className="space-y-4">
                    {project.description && (
                      <div>
                        <div className="text-sm font-medium text-gray-400 mb-1">Description</div>
                        <p className="text-gray-200">{project.description}</p>
                      </div>
                    )}
                    {project.repoUrl && (
                      <div>
                        <div className="text-sm font-medium text-gray-400 mb-1">Repository</div>
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          {project.repoUrl}
                        </a>
                      </div>
                    )}
                    {techStack.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-gray-400 mb-2">Tech Stack</div>
                        <div className="flex flex-wrap gap-2">
                          {techStack.map((tech: string) => (
                            <span
                              key={tech}
                              className="px-3 py-1 bg-gray-700 text-gray-200 rounded-full text-sm"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {project.aiAnalysis && (
                      <div>
                        <div className="text-sm font-medium text-gray-400 mb-2">AI Analysis</div>
                        <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-800">
                          <p className="text-sm text-blue-200">{project.aiAnalysis}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Insights */}
                {project.insights && project.insights.length > 0 && (
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Agent Insights</h2>
                    <div className="space-y-3">
                      {project.insights.map(insight => (
                        <div
                          key={insight.id}
                          className="p-4 bg-gray-700 rounded-lg border border-gray-600"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold uppercase text-gray-300">
                              {agents.find(a => a.type === insight.agentType)?.icon}{' '}
                              {insight.agentType}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                insight.priority === 'high'
                                  ? 'bg-red-900/30 text-red-400'
                                  : insight.priority === 'medium'
                                  ? 'bg-yellow-900/30 text-yellow-400'
                                  : 'bg-green-900/30 text-green-400'
                              }`}
                            >
                              {insight.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-200">{insight.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeView === 'all-tasks' && (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">All Tasks</h2>
                <KanbanBoard
                  tasks={project.tasks}
                  projectId={project.id}
                  onTaskUpdate={handleTaskUpdate}
                />
              </div>
            )}

            {activeView === 'open-prs' && (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">Open Pull Requests</h2>
                  <button
                    onClick={fetchPullRequests}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors"
                    disabled={loadingPRs}
                  >
                    {loadingPRs ? '🔄 Loading...' : '🔄 Refresh'}
                  </button>
                </div>

                {loadingPRs && pullRequests.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    Loading pull requests...
                  </div>
                ) : pullRequests.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    No open pull requests found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pullRequests.map(pr => (
                      <div
                        key={pr.number}
                        className="p-4 bg-gray-700 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-mono text-gray-400">#{pr.number}</span>
                              {pr.draft && (
                                <span className="text-xs px-2 py-0.5 bg-gray-600 text-gray-300 rounded">
                                  Draft
                                </span>
                              )}
                            </div>
                            <h3 className="text-white font-medium mb-2 break-words">
                              {pr.title}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                              <span>👤 {pr.user.login}</span>
                              <span>
                                📅 {new Date(pr.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <a
                            href={pr.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors flex-shrink-0"
                          >
                            View on GitHub →
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {agents.find(a => a.type === activeView) && (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <AgentBoard
                  agentType={activeView}
                  agentName={agents.find(a => a.type === activeView)!.name}
                  agentIcon={agents.find(a => a.type === activeView)!.icon}
                  tasks={project.tasks}
                  projectId={project.id}
                  onTaskUpdate={handleTaskUpdate}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

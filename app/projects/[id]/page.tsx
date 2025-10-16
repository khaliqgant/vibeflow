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

const agents = [
  { type: 'marketing', name: 'Marketing', icon: '📢' },
  { type: 'pricing', name: 'Pricing', icon: '💰' },
  { type: 'competitor', name: 'Competitor', icon: '⚔️' },
  { type: 'seo', name: 'SEO', icon: '🔍' },
  { type: 'blogging', name: 'Content', icon: '✍️' },
  { type: 'technical', name: 'Technical', icon: '⚙️' },
  { type: 'pm', name: 'Project Manager', icon: '📋' },
]

type ViewType = 'overview' | 'all-tasks' | string

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [activeView, setActiveView] = useState<ViewType>('overview')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    const res = await fetch(`/api/projects/${projectId}`)
    const data = await res.json()
    setProject(data)
  }

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    await fetchProject()
  }

  const handleAnalyzeProject = async () => {
    setIsAnalyzing(true)
    try {
      await fetch(`/api/projects/${projectId}/analyze`, {
        method: 'POST',
      })
      await fetchProject()
    } catch (error) {
      console.error('Error analyzing project:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  const completedTasks = project.tasks.filter(t => t.status === 'done').length
  const totalTasks = project.tasks.length
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const techStack = project.techStack ? JSON.parse(project.techStack) : []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ←
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
                {project.githubRepo && (
                  <p className="text-sm text-gray-500">
                    {project.githubOwner}/{project.githubRepo}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleAnalyzeProject}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
            >
              {isAnalyzing ? '🤖 Analyzing...' : '🤖 AI Analysis'}
            </button>
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
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                📊 Overview
              </button>
              <button
                onClick={() => setActiveView('all-tasks')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === 'all-tasks'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                📋 All Tasks
              </button>
              <div className="pt-4 pb-2 px-3">
                <p className="text-xs font-semibold text-gray-500 uppercase">Agents</p>
              </div>
              {agents.map(agent => {
                const agentTasks = project.tasks.filter(t => t.agentType === agent.type)
                return (
                  <button
                    key={agent.type}
                    onClick={() => setActiveView(agent.type)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeView === agent.type
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
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
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm text-gray-500 mb-1">Progress</div>
                    <div className="text-2xl font-semibold text-gray-900">{completionPercentage}%</div>
                    <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm text-gray-500 mb-1">Total Tasks</div>
                    <div className="text-2xl font-semibold text-gray-900">{totalTasks}</div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm text-gray-500 mb-1">In Progress</div>
                    <div className="text-2xl font-semibold text-gray-900">
                      {project.tasks.filter(t => t.status === 'in_progress').length}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm text-gray-500 mb-1">Completed</div>
                    <div className="text-2xl font-semibold text-gray-900">{completedTasks}</div>
                  </div>
                </div>

                {/* Project Info */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h2>
                  <div className="space-y-4">
                    {project.description && (
                      <div>
                        <div className="text-sm font-medium text-gray-500 mb-1">Description</div>
                        <p className="text-gray-900">{project.description}</p>
                      </div>
                    )}
                    {project.repoUrl && (
                      <div>
                        <div className="text-sm font-medium text-gray-500 mb-1">Repository</div>
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {project.repoUrl}
                        </a>
                      </div>
                    )}
                    {techStack.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-gray-500 mb-2">Tech Stack</div>
                        <div className="flex flex-wrap gap-2">
                          {techStack.map((tech: string) => (
                            <span
                              key={tech}
                              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {project.aiAnalysis && (
                      <div>
                        <div className="text-sm font-medium text-gray-500 mb-2">AI Analysis</div>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-900">{project.aiAnalysis}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Insights */}
                {project.insights && project.insights.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Agent Insights</h2>
                    <div className="space-y-3">
                      {project.insights.map(insight => (
                        <div
                          key={insight.id}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold uppercase text-gray-600">
                              {agents.find(a => a.type === insight.agentType)?.icon}{' '}
                              {insight.agentType}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                insight.priority === 'high'
                                  ? 'bg-red-100 text-red-800'
                                  : insight.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {insight.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{insight.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeView === 'all-tasks' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">All Tasks</h2>
                <KanbanBoard
                  tasks={project.tasks}
                  projectId={project.id}
                  onTaskUpdate={handleTaskUpdate}
                />
              </div>
            )}

            {agents.find(a => a.type === activeView) && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
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

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Project {
  id: string
  name: string
  description?: string
  status: string
  aiAnalysis?: string
  lastAnalyzedAt?: string
  repoUrl?: string
  tasks: Task[]
}

interface Task {
  id: string
  status: 'todo' | 'in_progress' | 'done'
}

export default function Home() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [scanPaths, setScanPaths] = useState<string[]>([''])
  const [isScanning, setIsScanning] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (projects.length === 0) {
      setShowOnboarding(true)
    }
  }, [projects])

  const fetchProjects = async () => {
    const res = await fetch('/api/projects')
    const data = await res.json()
    setProjects(data)
  }

  const handleScan = async () => {
    // Filter out empty paths
    const validPaths = scanPaths.filter(p => p.trim())
    if (validPaths.length === 0) return

    setIsScanning(true)
    try {
      // Scan all paths in parallel
      await Promise.all(
        validPaths.map(dirPath =>
          fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'scan', dirPath }),
          })
        )
      )
      await fetchProjects()
      setShowOnboarding(false)
      setScanPaths(['']) // Reset to single empty field
    } catch (error) {
      console.error('Error scanning projects:', error)
    } finally {
      setIsScanning(false)
    }
  }

  const addPathField = () => {
    setScanPaths([...scanPaths, ''])
  }

  const removePathField = (index: number) => {
    setScanPaths(scanPaths.filter((_, i) => i !== index))
  }

  const updatePath = (index: number, value: string) => {
    const newPaths = [...scanPaths]
    newPaths[index] = value
    setScanPaths(newPaths)
  }

  const getProjectCompletion = (project: Project) => {
    if (project.tasks.length === 0) return 0
    const completed = project.tasks.filter(t => t.status === 'done').length
    return Math.round((completed / project.tasks.length) * 100)
  }

  const getProjectStatusColor = (project: Project) => {
    const completion = getProjectCompletion(project)
    if (completion === 100) return 'text-green-600 bg-green-50'
    if (completion >= 50) return 'text-blue-600 bg-blue-50'
    if (completion > 0) return 'text-yellow-600 bg-yellow-50'
    return 'text-gray-600 bg-gray-50'
  }

  if (showOnboarding && projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-600 text-white text-4xl mb-6">
              🤖
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to VibeFlow</h1>
            <p className="text-lg text-gray-600">
              AI-powered project management that analyzes your repos and creates intelligent tasks
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Get Started</h2>
            <p className="text-gray-600 mb-6">
              Enter paths to your project directories. Add multiple paths to scan several locations at once.
            </p>

            <div className="space-y-4">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Project Directory Paths
                </label>
                {scanPaths.map((path, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={path}
                      onChange={(e) => updatePath(index, e.target.value)}
                      placeholder={index === 0 ? "/home/user/projects" : "Add another path..."}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (index === scanPaths.length - 1 && path.trim()) {
                            addPathField()
                          } else {
                            handleScan()
                          }
                        }
                      }}
                    />
                    {scanPaths.length > 1 && (
                      <button
                        onClick={() => removePathField(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove path"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addPathField}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  + Add another path
                </button>
                <p className="text-sm text-gray-500">
                  💡 Tip: Press Enter to add another path, or click "Scan Projects" when ready
                </p>
              </div>

              <button
                onClick={handleScan}
                disabled={isScanning || scanPaths.every(p => !p.trim())}
                className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-lg font-medium"
              >
                {isScanning ? '🤖 Scanning and analyzing...' : `🚀 Scan ${scanPaths.filter(p => p.trim()).length} ${scanPaths.filter(p => p.trim()).length === 1 ? 'Path' : 'Paths'}`}
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">What happens next?</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">1.</span>
                  <span>We'll scan your directory and find all projects</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">2.</span>
                  <span>AI agents analyze each project (code, README, GitHub data)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">3.</span>
                  <span>7 specialized agents create tasks: Marketing, Technical, PM, SEO, etc.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">4.</span>
                  <span>View your projects with intelligent task boards and insights</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xl">
                🤖
              </div>
              <h1 className="text-2xl font-bold text-gray-900">VibeFlow</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/knowledge-base')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                📚 Knowledge Base
              </button>
              <button
                onClick={() => router.push('/settings')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                ⚙️ Settings
              </button>
              <button
                onClick={() => setShowOnboarding(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                + Add Projects
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Onboarding Modal */}
      {showOnboarding && projects.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Add More Projects</h2>
              <button
                onClick={() => {
                  setShowOnboarding(false)
                  setScanPaths([''])
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Project Directory Paths
                </label>
                {scanPaths.map((path, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={path}
                      onChange={(e) => updatePath(index, e.target.value)}
                      placeholder={index === 0 ? "/path/to/projects" : "Add another path..."}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (index === scanPaths.length - 1 && path.trim()) {
                            addPathField()
                          } else {
                            handleScan()
                          }
                        }
                      }}
                    />
                    {scanPaths.length > 1 && (
                      <button
                        onClick={() => removePathField(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addPathField}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  + Add another path
                </button>
              </div>

              <button
                onClick={handleScan}
                disabled={isScanning || scanPaths.every(p => !p.trim())}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
              >
                {isScanning ? '🤖 Scanning...' : `Scan ${scanPaths.filter(p => p.trim()).length} ${scanPaths.filter(p => p.trim()).length === 1 ? 'Path' : 'Paths'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your Projects</h2>
          <p className="text-gray-600">{projects.length} projects • AI-powered task management</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const completion = getProjectCompletion(project)
            const todoCount = project.tasks.filter(t => t.status === 'todo').length
            const inProgressCount = project.tasks.filter(t => t.status === 'in_progress').length
            const doneCount = project.tasks.filter(t => t.status === 'done').length

            return (
              <div
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <span className={`ml-2 px-2 py-1 rounded-lg text-xs font-medium ${getProjectStatusColor(project)}`}>
                      {completion}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                  </div>

                  {/* Task Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-gray-300" />
                      <span className="text-gray-600">{todoCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <span className="text-gray-600">{inProgressCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-gray-600">{doneCount}</span>
                    </div>
                  </div>

                  {project.repoUrl && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>🔗</span>
                        <span className="truncate">{project.repoUrl.replace('https://', '')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {projects.length === 0 && !showOnboarding && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-xl mb-4">No projects found</div>
            <button
              onClick={() => setShowOnboarding(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Scan Projects
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

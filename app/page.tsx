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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

  // Poll for updates while any project is being analyzed
  useEffect(() => {
    const analyzingProjects = projects.filter(p => !p.lastAnalyzedAt)
    if (analyzingProjects.length === 0) return

    const pollInterval = setInterval(() => {
      fetchProjects()
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(pollInterval)
  }, [projects])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      const projectList = Array.isArray(data) ? data : []
      setProjects(projectList)

      // Only show onboarding if there are no projects after loading
      if (projectList.length === 0) {
        setShowOnboarding(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async (projectId: string, projectName: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      return
    }

    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })
      await fetchProjects()
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Failed to delete project')
    }
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
    if (completion === 100) return 'text-green-400 bg-green-900/30'
    if (completion >= 50) return 'text-blue-400 bg-blue-900/30'
    if (completion > 0) return 'text-yellow-400 bg-yellow-900/30'
    return 'text-gray-400 bg-gray-700'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-400">Loading projects...</p>
        </div>
      </div>
    )
  }

  if (showOnboarding && projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-600 text-white text-4xl mb-6">
              🤖
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Welcome to VibeFlow</h1>
            <p className="text-lg text-gray-300 mb-2">
              <strong className="font-semibold">AI-Powered Project Management That Actually Understands Your Code</strong>
            </p>
            <p className="text-gray-400">
              Point it at your repos. Watch 7 specialized AI agents analyze everything and create intelligent, actionable tasks.
            </p>
          </div>

          <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-8">
            <h2 className="text-xl font-semibold text-white mb-2">Get Started</h2>
            <p className="text-gray-300 mb-6">
              Enter paths to your project directories. Add multiple paths to scan several locations at once.
            </p>

            <div className="space-y-4">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  Project Directory Paths
                </label>
                {scanPaths.map((path, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={path}
                      onChange={(e) => updatePath(index, e.target.value)}
                      placeholder={index === 0 ? "/home/user/projects" : "Add another path..."}
                      className="flex-1 px-4 py-3 border border-gray-600 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-white placeholder:text-gray-400"
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
                        className="px-3 py-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Remove path"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addPathField}
                  className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                >
                  + Add another path
                </button>
                <p className="text-sm text-gray-400">
                  💡 Tip: Press Enter to add another path, or click &quot;Scan Projects&quot; when ready
                </p>
              </div>

              <button
                onClick={handleScan}
                disabled={isScanning || scanPaths.every(p => !p.trim())}
                className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 transition-colors text-lg font-medium"
              >
                {isScanning ? '🤖 Scanning and analyzing...' : `🚀 Scan ${scanPaths.filter(p => p.trim()).length} ${scanPaths.filter(p => p.trim()).length === 1 ? 'Path' : 'Paths'}`}
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-700">
              <h3 className="font-medium text-white mb-3">What happens next?</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">1.</span>
                  <span>We&apos;ll scan your directory and find all projects</span>
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
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xl">
                🤖
              </div>
              <h1 className="text-2xl font-bold text-white">VibeFlow</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/settings')}
                className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
          <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-8 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white">Add More Projects</h2>
              <button
                onClick={() => {
                  setShowOnboarding(false)
                  setScanPaths([''])
                }}
                className="text-gray-400 hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  Project Directory Paths
                </label>
                {scanPaths.map((path, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={path}
                      onChange={(e) => updatePath(index, e.target.value)}
                      placeholder={index === 0 ? "/path/to/projects" : "Add another path..."}
                      className="flex-1 px-4 py-3 border border-gray-600 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder:text-gray-400"
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
                        className="px-3 py-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addPathField}
                  className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                >
                  + Add another path
                </button>
              </div>

              <button
                onClick={handleScan}
                disabled={isScanning || scanPaths.every(p => !p.trim())}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 transition-colors font-medium"
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
          <h2 className="text-2xl font-semibold text-white mb-2">Your Projects</h2>
          <p className="text-gray-400">{projects.length} projects • AI-powered task management</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const completion = getProjectCompletion(project)
            const todoCount = project.tasks.filter(t => t.status === 'todo').length
            const inProgressCount = project.tasks.filter(t => t.status === 'in_progress').length
            const doneCount = project.tasks.filter(t => t.status === 'done').length

            const isAnalyzing = !project.lastAnalyzedAt

            return (
              <div
                key={project.id}
                className={`bg-gray-800 rounded-xl border border-gray-700 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all group relative ${
                  isAnalyzing ? 'opacity-90' : ''
                }`}
              >
                <div className="p-6 cursor-pointer" onClick={() => router.push(`/projects/${project.id}`)}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                          {project.name}
                        </h3>
                        {isAnalyzing && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-900/40 text-blue-400 text-xs font-medium rounded-full border border-blue-500/30 animate-pulse">
                            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Analyzing...
                          </span>
                        )}
                      </div>
                      {project.description && (
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {!isAnalyzing && (
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getProjectStatusColor(project)}`}>
                          {completion}%
                        </span>
                      )}
                      <button
                        onClick={(e) => handleDeleteProject(project.id, project.name, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-all"
                        title="Delete project"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                  </div>

                  {/* Task Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-gray-500" />
                      <span className="text-gray-400">{todoCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <span className="text-gray-400">{inProgressCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-gray-400">{doneCount}</span>
                    </div>
                  </div>

                  {project.repoUrl && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
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

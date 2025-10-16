'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Project {
  id: string
  name: string
  description?: string
}

export default function KnowledgeBasePage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    setLoading(true)
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      setProjects(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
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
              <div>
                <h1 className="text-2xl font-semibold text-white">
                  📚 Knowledge Base
                </h1>
                <p className="text-sm text-gray-400">
                  Select a project to view its knowledge base
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-400">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No projects yet
            </h3>
            <p className="text-gray-400 mb-6">
              Create a project first to access its knowledge base
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Go to Projects
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-6 bg-blue-900/30 border border-blue-800 rounded-lg p-4">
              <p className="text-blue-300 text-sm">
                💡 Knowledge bases are now organized per project. Select a project below to view its documentation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}/knowledge-base`}
                  className="block bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all"
                >
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <div className="mt-4 text-sm text-blue-400">
                    View Knowledge Base →
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

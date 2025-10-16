'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface KBDocument {
  id: string
  title: string
  slug: string
  tags: { tag: { id: string; name: string; color?: string } }[]
  project?: { id: string; name: string }
  source?: string
  createdAt: string
  updatedAt: string
}

interface Tag {
  id: string
  name: string
  color?: string
  _count: { documents: number }
}

export default function KnowledgeBasePage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<KBDocument[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDocuments()
    loadTags()
  }, [selectedTags, searchQuery])

  async function loadDocuments() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      selectedTags.forEach(tag => params.append('tag', tag))

      const res = await fetch(`/api/knowledge-base?${params}`)
      const data = await res.json()
      setDocuments(data)
    } catch (error) {
      console.error('Failed to load documents:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadTags() {
    try {
      const res = await fetch('/api/knowledge-base/tags')
      const data = await res.json()
      setAllTags(data)
    } catch (error) {
      console.error('Failed to load tags:', error)
    }
  }

  function toggleTag(tagName: string) {
    setSelectedTags(prev =>
      prev.includes(tagName)
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    )
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                📚 Knowledge Base
              </h1>
              <p className="text-gray-600">
                AI-generated documentation and guides
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all text-gray-700"
            >
              ← Back to Projects
            </Link>
          </div>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tag Filter */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by Tags</h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.name)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    selectedTags.includes(tag.name)
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag.name} ({tag._count.documents})
                </button>
              ))}
              {allTags.length === 0 && (
                <p className="text-gray-500 text-sm">No tags yet</p>
              )}
            </div>
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No documents yet
            </h3>
            <p className="text-gray-600 mb-6">
              Documents created via MCP or the API will appear here
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto text-left">
              <h4 className="font-semibold text-blue-900 mb-2">💡 How to add documents</h4>
              <p className="text-sm text-blue-800 mb-2">
                Use the MCP tool from Claude Code:
              </p>
              <code className="block bg-blue-100 p-2 rounded text-sm text-blue-900">
                create_knowledge_base_document(title, content, tags, project_id)
              </code>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map(doc => (
              <Link
                key={doc.id}
                href={`/knowledge-base/${doc.slug}`}
                className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {doc.title}
                  </h3>
                  {doc.source === 'mcp' && (
                    <span className="flex-shrink-0 ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      MCP
                    </span>
                  )}
                </div>

                {doc.project && (
                  <div className="mb-3 text-sm text-gray-600">
                    📁 {doc.project.name}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {doc.tags.slice(0, 3).map(({ tag }) => (
                    <span
                      key={tag.id}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                    >
                      {tag.name}
                    </span>
                  ))}
                  {doc.tags.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{doc.tags.length - 3} more
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  Updated {formatDate(doc.updatedAt)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

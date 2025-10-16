'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface KBDocument {
  id: string
  title: string
  slug: string
  summary?: string
  tags: { tag: { id: string; name: string; color?: string } }[]
  source?: string
  createdAt: string
  updatedAt: string
}

interface Project {
  id: string
  name: string
}

export default function ProjectKnowledgeBasePage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [documents, setDocuments] = useState<KBDocument[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) return
    loadProject()
    loadDocuments()
  }, [projectId, searchQuery])

  async function loadProject() {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      const data = await res.json()
      setProject(data)
    } catch (error) {
      console.error('Failed to load project:', error)
    }
  }

  async function loadDocuments() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ projectId })
      if (searchQuery) params.append('search', searchQuery)

      const res = await fetch(`/api/knowledge-base?${params}`)
      const data = await res.json()
      setDocuments(data)
    } catch (error) {
      console.error('Failed to load documents:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    if (!projectId) return

    setUploading(true)
    setUploadError(null)
    setUploadSuccess(null)

    const fileArray = Array.from(files)
    const errors: string[] = []
    let successCount = 0

    // Validate all files first
    for (const file of fileArray) {
      if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
        errors.push(`${file.name}: Only markdown files are supported`)
      }
    }

    if (errors.length > 0) {
      setUploadError(errors.join(', '))
      setUploading(false)
      return
    }

    // Upload all files
    for (const file of fileArray) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('projectId', projectId)

        const res = await fetch('/api/knowledge-base/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const error = await res.json()
          errors.push(`${file.name}: ${error.error || 'Upload failed'}`)
        } else {
          successCount++
        }
      } catch (error) {
        console.error('Upload error:', error)
        errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Failed to upload'}`)
      }
    }

    // Show results
    if (successCount > 0) {
      setUploadSuccess(`Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}`)
      setTimeout(() => setUploadSuccess(null), 3000)
      await loadDocuments()
    }

    if (errors.length > 0) {
      setUploadError(errors.join('; '))
    }

    setUploading(false)
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files)
    }
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
                  📚 Knowledge Base
                </h1>
                {project && (
                  <p className="text-sm text-gray-400">{project.name}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        {/* Upload Area */}
        <div className="mb-6">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-900/20'
                : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
            }`}
          >
            <input
              type="file"
              accept=".md,.markdown"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer"
            >
              <div className="text-5xl mb-3">📄</div>
              <p className="text-white font-semibold mb-1">
                {uploading ? 'Uploading...' : 'Drop markdown files here or click to upload'}
              </p>
              <p className="text-sm text-gray-400">
                Supports .md and .markdown files
              </p>
            </label>

            {uploading && (
              <div className="mt-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-4 border-blue-500 border-t-transparent"></div>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="mt-3 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
              {uploadError}
            </div>
          )}

          {uploadSuccess && (
            <div className="mt-3 p-3 bg-green-900/30 border border-green-800 rounded-lg text-green-400 text-sm">
              {uploadSuccess}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-400">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No documents yet
            </h3>
            <p className="text-gray-400 mb-6">
              Documents created via MCP or the API will appear here
            </p>
            <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4 max-w-2xl mx-auto text-left">
              <h4 className="font-semibold text-blue-400 mb-2">💡 How to add documents</h4>
              <p className="text-sm text-blue-300 mb-2">
                Use the MCP tool from Claude Code:
              </p>
              <code className="block bg-blue-900/50 p-2 rounded text-sm text-blue-200">
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
                className="block bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white line-clamp-2">
                    {doc.title}
                  </h3>
                  {doc.source && (
                    <span className={`flex-shrink-0 ml-2 text-xs px-2 py-1 rounded ${
                      doc.source === 'mcp'
                        ? 'bg-purple-900/30 text-purple-400'
                        : doc.source === 'markdown'
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-blue-900/30 text-blue-400'
                    }`}>
                      {doc.source.toUpperCase()}
                    </span>
                  )}
                </div>

                {doc.summary && (
                  <p className="text-sm text-gray-400 mb-4 line-clamp-3">
                    {doc.summary}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {doc.tags.slice(0, 3).map(({ tag }) => (
                    <span
                      key={tag.id}
                      className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
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

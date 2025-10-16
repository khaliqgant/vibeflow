'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'

interface KBDocument {
  id: string
  title: string
  content: string
  slug: string
  tags: { tag: { id: string; name: string; color?: string } }[]
  project?: { id: string; name: string }
  source?: string
  createdAt: string
  updatedAt: string
}

export default function KnowledgeBaseDocumentPage() {
  const params = useParams()
  const router = useRouter()
  const [document, setDocument] = useState<KBDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDocument()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.slug])

  async function loadDocument() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/knowledge-base/${params.slug}`)
      if (!res.ok) {
        throw new Error('Document not found')
      }
      const data = await res.json()
      setDocument(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      const res = await fetch(`/api/knowledge-base/${params.slug}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        router.push('/knowledge-base')
      }
    } catch {
      alert('Failed to delete document')
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-400">Loading document...</p>
        </div>
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-2">Document not found</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            href="/knowledge-base"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Knowledge Base
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={document.project ? `/projects/${document.project.id}/knowledge-base` : '/knowledge-base'}
            className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4 transition-colors"
          >
            ← Back to Knowledge Base
          </Link>

          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-4xl font-bold text-white">
                {document.title}
              </h1>
              <button
                onClick={handleDelete}
                className="px-3 py-2 text-sm text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">📅</span>
                Updated {formatDate(document.updatedAt)}
              </div>

              {document.source && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">🔧</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    document.source === 'mcp'
                      ? 'bg-purple-900/30 text-purple-400'
                      : document.source === 'markdown'
                      ? 'bg-green-900/30 text-green-400'
                      : 'bg-blue-900/30 text-blue-400'
                  }`}>
                    {document.source.toUpperCase()}
                  </span>
                </div>
              )}

              {document.project && (
                <Link
                  href={`/projects/${document.project.id}`}
                  className="flex items-center gap-2 hover:text-blue-400 transition-colors"
                >
                  <span className="text-gray-500">📁</span>
                  {document.project.name}
                </Link>
              )}
            </div>

            {/* Tags */}
            {document.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {document.tags.map(({ tag }) => (
                  <Link
                    key={tag.id}
                    href={`/knowledge-base?tag=${encodeURIComponent(tag.name)}`}
                    className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-gray-600 transition-colors"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
          <article className="prose prose-lg prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                // Custom styling for code blocks
                code({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode; [key: string]: unknown }) {
                  return inline ? (
                    <code className="bg-gray-700 text-gray-200 px-1.5 py-0.5 rounded text-sm" {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                },
                // Custom styling for links
                a({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) {
                  return (
                    <a
                      className="text-blue-400 hover:text-blue-300 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    >
                      {children}
                    </a>
                  )
                },
              }}
            >
              {document.content}
            </ReactMarkdown>
          </article>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-between items-center">
          <Link
            href={document.project ? `/projects/${document.project.id}/knowledge-base` : '/knowledge-base'}
            className="px-6 py-3 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:bg-gray-700 transition-all"
          >
            ← All Documents
          </Link>

          {document.project && (
            <Link
              href={`/projects/${document.project.id}`}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Project →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

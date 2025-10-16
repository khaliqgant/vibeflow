import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const tags = searchParams.getAll('tag')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (projectId) {
      where.projectId = projectId
    }

    if (tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: { in: tags }
          }
        }
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ]
    }

    const documents = await prisma.knowledgeBaseDocument.findMany({
      where,
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching knowledge base:', error)
    return NextResponse.json({ error: 'Failed to fetch knowledge base documents' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, content, projectId, tags, source } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Check if slug already exists
    const existing = await prisma.knowledgeBaseDocument.findUnique({
      where: { slug }
    })

    if (existing) {
      // Append timestamp to make unique
      const uniqueSlug = `${slug}-${Date.now()}`
      return await createDocument(title, content, uniqueSlug, projectId, tags, source)
    }

    return await createDocument(title, content, slug, projectId, tags, source)
  } catch (error) {
    console.error('Error creating knowledge base document:', error)
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
  }
}

async function createDocument(
  title: string,
  content: string,
  slug: string,
  projectId?: string,
  tags?: string[],
  source?: string
) {
  // Create or get tags
  const tagConnections = []
  if (tags && tags.length > 0) {
    for (const tagName of tags) {
      let tag = await prisma.knowledgeBaseTag.findUnique({
        where: { name: tagName }
      })

      if (!tag) {
        tag = await prisma.knowledgeBaseTag.create({
          data: { name: tagName }
        })
      }

      tagConnections.push({
        tag: {
          connect: { id: tag.id }
        }
      })
    }
  }

  const document = await prisma.knowledgeBaseDocument.create({
    data: {
      title,
      content,
      slug,
      projectId: projectId || null,
      source: source || 'manual',
      tags: {
        create: tagConnections.map(tc => ({
          tag: tc.tag
        }))
      }
    },
    include: {
      tags: {
        include: {
          tag: true
        }
      },
      project: true
    }
  })

  return NextResponse.json(document)
}

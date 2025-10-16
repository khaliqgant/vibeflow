import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractTitle, extractTags } from '@/lib/markdown/kb-extractor'
import { generateKBSummary } from '@/lib/ai/summary'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const projectId = formData.get('projectId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    // Validate file type
    if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
      return NextResponse.json(
        { error: 'Only markdown files (.md, .markdown) are supported' },
        { status: 400 }
      )
    }

    // Read file content
    const content = await file.text()

    if (content.trim().length < 50) {
      return NextResponse.json(
        { error: 'File content is too short (minimum 50 characters)' },
        { status: 400 }
      )
    }

    // Extract metadata
    const filename = file.name
    const title = extractTitle(content, filename)
    const tags = extractTags(content, filename, filename)

    // Generate AI summary
    let summary: string | undefined
    try {
      summary = await generateKBSummary(content)
    } catch (error) {
      console.warn('Failed to generate AI summary:', error)
      // Continue without summary if AI fails
    }

    // Create slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 100)

    // Check for duplicate slug
    const existingDoc = await prisma.knowledgeBaseDocument.findFirst({
      where: { slug, projectId },
    })

    if (existingDoc) {
      return NextResponse.json(
        { error: 'A document with this title already exists in the project' },
        { status: 409 }
      )
    }

    // Create document
    const document = await prisma.knowledgeBaseDocument.create({
      data: {
        title,
        slug,
        content,
        summary,
        source: 'upload',
        projectId,
      },
    })

    // Create or connect tags
    for (const tagName of tags) {
      const tag = await prisma.knowledgeBaseTag.upsert({
        where: { name: tagName },
        update: {},
        create: {
          name: tagName,
          color: getRandomTagColor(),
        },
      })

      await prisma.knowledgeBaseDocumentTag.create({
        data: {
          documentId: document.id,
          tagId: tag.id,
        },
      })
    }

    // Return created document with tags
    const documentWithTags = await prisma.knowledgeBaseDocument.findUnique({
      where: { id: document.id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return NextResponse.json(documentWithTags, { status: 201 })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload and process file' },
      { status: 500 }
    )
  }
}

function getRandomTagColor(): string {
  const colors = [
    '#3B82F6', // blue
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#10B981', // green
    '#F59E0B', // yellow
    '#EF4444', // red
    '#06B6D4', // cyan
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

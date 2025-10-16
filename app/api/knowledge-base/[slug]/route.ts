import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const document = await prisma.knowledgeBaseDocument.findUnique({
      where: { slug },
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
      }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    const { title, content, tags } = body

    const updateData: Record<string, unknown> = {}

    if (title) updateData.title = title
    if (content) updateData.content = content

    // Handle tags update
    if (tags) {
      // Remove existing tag connections
      await prisma.knowledgeBaseDocumentTag.deleteMany({
        where: { document: { slug } }
      })

      // Create new tag connections
      const tagConnections = []
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

      updateData.tags = {
        create: tagConnections.map(tc => ({
          tag: tc.tag
        }))
      }
    }

    const document = await prisma.knowledgeBaseDocument.update({
      where: { slug },
      data: updateData,
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
  } catch (error) {
    console.error('Error updating document:', error)
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    await prisma.knowledgeBaseDocument.delete({
      where: { slug }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}

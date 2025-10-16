import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOpenPRs } from '@/lib/github/client'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        githubOwner: true,
        githubRepo: true,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (!project.githubOwner || !project.githubRepo) {
      return NextResponse.json({ error: 'Project does not have GitHub information' }, { status: 400 })
    }

    const prs = await getOpenPRs(project.githubOwner, project.githubRepo)

    return NextResponse.json(prs)
  } catch (error) {
    console.error('Error fetching pull requests:', error)
    return NextResponse.json({ error: 'Failed to fetch pull requests' }, { status: 500 })
  }
}

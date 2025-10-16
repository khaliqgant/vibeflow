import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    const agents = await prisma.agent.findMany({
      where: { projectId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' },
      ],
    })
    return NextResponse.json(agents)
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projectId, type, name, icon, description, systemPrompt, taskCategories } = body

    // Validate required fields
    if (!projectId || !type || !name || !description || !systemPrompt) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, type, name, description, systemPrompt' },
        { status: 400 }
      )
    }

    // Check if agent with this type already exists for this project
    const existing = await prisma.agent.findFirst({
      where: {
        projectId,
        type,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'An agent with this type already exists for this project' },
        { status: 409 }
      )
    }

    const agent = await prisma.agent.create({
      data: {
        projectId,
        type,
        name,
        icon: icon || '🤖',
        description,
        systemPrompt,
        taskCategories: JSON.stringify(taskCategories || []),
        isDefault: false,
        isActive: true,
      },
    })

    return NextResponse.json(agent)
  } catch (error) {
    console.error('Error creating agent:', error)
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 })
  }
}

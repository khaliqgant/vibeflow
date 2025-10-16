import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateAllAgentTasks } from '@/lib/agents/task-generator'
import { isDuplicateTask } from '@/lib/agents/task-utils'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json()
    const { count = 20 } = body // Generate up to 20 more tasks

    // Get project
    const project = await prisma.project.findUnique({
      where: { id },
      include: { tasks: true },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get current task count
    const currentTaskCount = project.tasks.length

    // Get active agents for this project
    const dbAgents = await prisma.agent.findMany({
      where: {
        projectId: id,
        isActive: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    const agents = dbAgents.map(agent => ({
      type: agent.type,
      name: agent.name,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
      taskCategories: JSON.parse(agent.taskCategories) as string[],
    }))

    // Build minimal context (we don't need full analysis again)
    const context = {
      name: project.name,
      description: project.description,
    }

    // Generate tasks from agents
    console.log(`Generating ${count} more tasks for project ${id}`)
    const agentAnalyses = await generateAllAgentTasks(agents, context)

    // Collect all tasks and prioritize
    const allTasks: Array<{
      agentType: string
      task: {
        title: string
        description: string
        priority: string
        reasoning?: string
      }
      priorityScore: number
    }> = []

    for (const [agentType, agentAnalysis] of agentAnalyses) {
      for (const task of agentAnalysis.tasks) {
        const priorityScore = task.priority === 'high' ? 3 : task.priority === 'medium' ? 2 : 1
        allTasks.push({ agentType, task, priorityScore })
      }
    }

    // Sort by priority and take the requested count
    allTasks.sort((a, b) => b.priorityScore - a.priorityScore)
    const tasksToCreate = allTasks.slice(0, count)

    // Get the max order from existing tasks
    const maxOrder = project.tasks.reduce((max, t) => Math.max(max, t.order), 0)
    let taskOrder = maxOrder + 1

    // Create new tasks (with duplicate checking)
    let createdCount = 0
    for (const { agentType, task } of tasksToCreate) {
      // Check for duplicates
      const isDuplicate = await isDuplicateTask(id, task.title)
      if (isDuplicate) {
        console.log(`Skipping duplicate task: ${task.title}`)
        continue
      }

      await prisma.task.create({
        data: {
          projectId: id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: 'todo',
          agentType,
          aiReasoning: task.reasoning,
          order: taskOrder++,
        },
      })
      createdCount++
    }

    console.log(`Generated ${createdCount} additional tasks (${tasksToCreate.length - createdCount} duplicates skipped)`)

    return NextResponse.json({
      success: true,
      tasksGenerated: createdCount,
      totalTasks: currentTaskCount + createdCount,
    })
  } catch (error) {
    console.error('Error generating more tasks:', error)
    return NextResponse.json(
      { error: 'Failed to generate more tasks' },
      { status: 500 }
    )
  }
}

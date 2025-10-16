import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetProjectId } = await params
    const body = await request.json()
    const { sourceProjectId } = body

    if (!sourceProjectId) {
      return NextResponse.json(
        { error: 'Source project ID is required' },
        { status: 400 }
      )
    }

    // Fetch both projects
    const [targetProject, sourceProject] = await Promise.all([
      prisma.project.findUnique({ where: { id: targetProjectId } }),
      prisma.project.findUnique({
        where: { id: sourceProjectId },
        include: {
          tasks: true,
          insights: true,
        },
      }),
    ])

    if (!targetProject || !sourceProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Parse existing repositories
    const repositories = targetProject.repositories
      ? JSON.parse(targetProject.repositories)
      : []

    // Create new repository entry from source project
    const newRepo = {
      name: sourceProject.name,
      path: sourceProject.path,
      repoUrl: sourceProject.repoUrl || undefined,
      description: sourceProject.description || undefined,
    }

    // Check if repository already exists
    if (repositories.some((r: { name: string }) => r.name === newRepo.name)) {
      return NextResponse.json(
        { error: 'Repository with this name already exists in the project' },
        { status: 400 }
      )
    }

    // Add new repository
    repositories.push(newRepo)

    // Update target project with new repository
    await prisma.project.update({
      where: { id: targetProjectId },
      data: {
        repositories: JSON.stringify(repositories),
      },
    })

    // Migrate tasks from source to target project with repository tag
    for (const task of sourceProject.tasks) {
      const currentTags = task.tags ? JSON.parse(task.tags) : []
      if (!currentTags.includes(sourceProject.name)) {
        currentTags.push(sourceProject.name)
      }

      await prisma.task.update({
        where: { id: task.id },
        data: {
          projectId: targetProjectId,
          tags: JSON.stringify(currentTags),
        },
      })
    }

    // Migrate insights from source to target project
    for (const insight of sourceProject.insights) {
      await prisma.insight.update({
        where: { id: insight.id },
        data: {
          projectId: targetProjectId,
        },
      })
    }

    // Delete the source project
    await prisma.project.delete({
      where: { id: sourceProjectId },
    })

    return NextResponse.json({
      success: true,
      message: `Successfully merged ${sourceProject.name} as a repository`,
    })
  } catch (error) {
    console.error('Error adding repository:', error)
    return NextResponse.json(
      { error: 'Failed to add repository' },
      { status: 500 }
    )
  }
}

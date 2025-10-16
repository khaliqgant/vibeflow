import { NextResponse } from 'next/server'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { scanDirectory } from '@/lib/scanner'
import { orchestrateProjectAnalysis } from '@/lib/agents/orchestrator'
import { createDefaultAgentsForProject } from '@/lib/agents/create-default-agents'

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        tasks: {
          orderBy: { order: 'asc' },
        },
        insights: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json(projects)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, dirPath, ...projectData } = body

    if (action === 'scan' && dirPath) {
      // Scan directory for projects
      const scannedProjects = await scanDirectory(dirPath)
      const results = []

      // Group scanned projects by suggested parent name
      const projectGroups = new Map<string | undefined, typeof scannedProjects>()
      for (const scanned of scannedProjects) {
        const groupKey = scanned.suggestedParentName
        if (!projectGroups.has(groupKey)) {
          projectGroups.set(groupKey, [])
        }
        projectGroups.get(groupKey)!.push(scanned)
      }

      // Process each group
      for (const [parentName, groupProjects] of projectGroups) {
        let parentProject: any = null

        // If we have a suggested parent name and multiple repos, create parent project
        if (parentName && groupProjects.length > 1) {
          // Check if parent already exists
          const existingParent = await prisma.project.findFirst({
            where: {
              name: parentName,
              parentProjectId: null  // Top-level projects only
            },
          })

          if (!existingParent) {
            // Create virtual parent project
            parentProject = await prisma.project.create({
              data: {
                name: parentName,
                path: path.dirname(groupProjects[0].path),  // Parent directory
                description: `Multi-repo project with ${groupProjects.length} repositories`,
                status: 'active',
              },
            })
            // Create default agents for parent project
            await createDefaultAgentsForProject(parentProject.id)
          } else {
            parentProject = existingParent
          }
        }

        // Create each scanned project
        for (const scanned of groupProjects) {
          // Check if project already exists
          const existing = await prisma.project.findUnique({
            where: { path: scanned.path },
          })

          if (existing) {
            results.push({ ...existing, skipped: true })
            continue
          }

          // Create project
          const project = await prisma.project.create({
            data: {
              name: scanned.name,
              path: scanned.path,
              description: scanned.description,
              repoUrl: scanned.repoUrl,
              parentProjectId: parentProject?.id,
              projectGroupId: parentProject?.id,  // Use same ID for grouping
            },
          })

          // Create default agents for this project
          await createDefaultAgentsForProject(project.id)

          // Trigger AI analysis asynchronously (don't wait for it)
          orchestrateProjectAnalysis(project.id).catch(err => {
            console.error(`Failed to analyze project ${project.id}:`, err)
          })

          results.push(project)
        }

        // If we created a parent project, trigger analysis on it too
        if (parentProject && !projectGroups.has(undefined)) {
          orchestrateProjectAnalysis(parentProject.id).catch(err => {
            console.error(`Failed to analyze parent project ${parentProject.id}:`, err)
          })
        }
      }

      return NextResponse.json({ projects: results, scanned: scannedProjects.length })
    }

    // Create single project
    const project = await prisma.project.create({
      data: projectData,
      include: { tasks: true },
    })

    // Create default agents for this project
    await createDefaultAgentsForProject(project.id)

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}

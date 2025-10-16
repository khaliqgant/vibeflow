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
  } catch {
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
        // If we have a suggested parent name and multiple repos, create single project with repositories
        if (parentName && groupProjects.length > 1) {
          // Check if project already exists
          const existing = await prisma.project.findFirst({
            where: {
              name: parentName,
            },
          })

          if (existing) {
            results.push({ ...existing, skipped: true })
            continue
          }

          // Create single project with multiple repositories
          const repositories = groupProjects.map(repo => ({
            name: repo.name,
            path: repo.path,
            repoUrl: repo.repoUrl,
            description: repo.description,
          }))

          const project = await prisma.project.create({
            data: {
              name: parentName,
              path: path.dirname(groupProjects[0].path),  // Parent directory
              description: groupProjects[0].description || `Multi-repo project with ${groupProjects.length} repositories`,
              repoUrl: groupProjects[0].repoUrl,
              repositories: JSON.stringify(repositories),
              status: 'active',
            },
          })

          // Create default agents for this project
          await createDefaultAgentsForProject(project.id)

          // Trigger AI analysis asynchronously (don't wait for it)
          orchestrateProjectAnalysis(project.id).catch(err => {
            console.error(`Failed to analyze project ${project.id}:`, err)
          })

          results.push(project)
        } else {
          // Single repo - create as standalone project
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

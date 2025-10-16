import fs from 'fs/promises'
import path from 'path'
import { analyzeProject, analyzeCode } from '../ai/claude'
import { parseGitHubUrl, getOpenPRs, getOpenIssues, getRepoInfo } from '../github/client'
import { getAllAgents } from './definitions'
import { generateAllAgentTasks } from './task-generator'
import { ProjectContext } from './types'
import { prisma } from '../prisma'

export async function orchestrateProjectAnalysis(projectId: string) {
  console.log(`Starting analysis for project ${projectId}`)

  // Get project from database
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    throw new Error('Project not found')
  }

  // Build context
  const context = await buildProjectContext(project)

  // Run Claude analysis on the project
  const analysis = await analyzeProject(context)

  // Update project with AI analysis
  await prisma.project.update({
    where: { id: projectId },
    data: {
      aiAnalysis: analysis.summary,
      techStack: JSON.stringify(analysis.techStack),
      lastAnalyzedAt: new Date(),
    },
  })

  // Get all agents
  const agents = getAllAgents()

  // Run all agents in parallel
  console.log(`Running ${agents.length} agents...`)
  const agentAnalyses = await generateAllAgentTasks(agents, context)

  // Store insights and create tasks
  let taskOrder = 0
  for (const [agentType, agentAnalysis] of agentAnalyses) {
    // Create insights
    for (const insight of agentAnalysis.insights) {
      await prisma.projectInsight.create({
        data: {
          projectId,
          agentType,
          title: insight.slice(0, 100),
          content: insight,
          priority: 'medium',
        },
      })
    }

    // Create tasks
    for (const task of agentAnalysis.tasks) {
      await prisma.task.create({
        data: {
          projectId,
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: 'todo',
          agentType,
          aiReasoning: task.reasoning,
          order: taskOrder++,
        },
      })
    }
  }

  console.log(`Analysis complete for project ${projectId}`)

  return {
    analysis,
    agentCount: agents.length,
    totalTasks: Array.from(agentAnalyses.values()).reduce(
      (sum, a) => sum + a.tasks.length,
      0
    ),
    totalInsights: Array.from(agentAnalyses.values()).reduce(
      (sum, a) => sum + a.insights.length,
      0
    ),
  }
}

async function buildProjectContext(project: any): Promise<ProjectContext> {
  const context: ProjectContext = {
    name: project.name,
    description: project.description,
    repoUrl: project.repoUrl,
  }

  // Read README
  try {
    const readmePath = path.join(project.path, 'README.md')
    context.readme = await fs.readFile(readmePath, 'utf-8')
  } catch {
    // README not found or not readable
  }

  // Analyze code structure (just get a basic file tree)
  try {
    context.codeStructure = await getCodeStructure(project.path)
  } catch {
    // Could not analyze structure
  }

  // Get GitHub data if available
  if (project.repoUrl) {
    const ghInfo = parseGitHubUrl(project.repoUrl)
    if (ghInfo) {
      await prisma.project.update({
        where: { id: project.id },
        data: {
          githubOwner: ghInfo.owner,
          githubRepo: ghInfo.repo,
        },
      })

      const [prs, issues, repoInfo] = await Promise.all([
        getOpenPRs(ghInfo.owner, ghInfo.repo),
        getOpenIssues(ghInfo.owner, ghInfo.repo),
        getRepoInfo(ghInfo.owner, ghInfo.repo),
      ])

      context.openPRs = prs
      context.openIssues = issues

      if (repoInfo) {
        if (!context.description && repoInfo.description) {
          context.description = repoInfo.description
        }
        if (repoInfo.topics && repoInfo.topics.length > 0) {
          context.techStack = repoInfo.topics
        }
      }
    }
  }

  return context
}

async function getCodeStructure(projectPath: string): Promise<string> {
  try {
    const entries = await fs.readdir(projectPath, { withFileTypes: true })
    const structure: string[] = []

    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue
      }

      if (entry.isDirectory()) {
        structure.push(`📁 ${entry.name}/`)
        // Get one level deep
        try {
          const subEntries = await fs.readdir(path.join(projectPath, entry.name), {
            withFileTypes: true,
          })
          for (const sub of subEntries.slice(0, 10)) {
            if (!sub.name.startsWith('.')) {
              structure.push(`  ${sub.isDirectory() ? '📁' : '📄'} ${sub.name}`)
            }
          }
        } catch {
          // Skip subdirectory
        }
      } else {
        structure.push(`📄 ${entry.name}`)
      }
    }

    return structure.join('\n')
  } catch (error) {
    return 'Unable to read project structure'
  }
}

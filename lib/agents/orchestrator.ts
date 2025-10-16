import fs from 'fs/promises'
import path from 'path'
import { analyzeProject } from '../ai/claude'
import { parseGitHubUrl, getOpenPRs, getOpenIssues, getRepoInfo } from '../github/client'
import { generateAllAgentTasks } from './task-generator'
import { ProjectContext } from './types'
import { prisma } from '../prisma'
import { extractTasksFromProject, ExtractedTask } from '../markdown/task-extractor'
import { extractKBDocumentsFromProject } from '../markdown/kb-extractor'
import { generateWithAI } from '../ai/provider'
import { isDuplicateTask } from './task-utils'

async function generateDocumentSummary(title: string, content: string): Promise<string> {
  try {
    const prompt = `Summarize this documentation in 2-3 concise sentences. Focus on the key purpose and main topics covered.

Title: ${title}

Content:
${content.slice(0, 3000)}

Provide only the summary, no preamble.`

    const summary = await generateWithAI('You are a technical documentation summarizer.', prompt, {
      maxTokens: 200,
    })

    return summary.trim()
  } catch (error) {
    console.error('Failed to generate summary:', error)
    // Fallback: extract first paragraph
    const lines = content.split('\n').filter(l => l.trim())
    const firstParagraph = lines.find(l => !l.startsWith('#') && l.length > 20)
    return firstParagraph?.slice(0, 200) || 'Documentation'
  }
}

interface EnrichedTask {
  title: string
  description: string
  reasoning: string
  priority: 'low' | 'medium' | 'high'
}

async function enrichTaskWithAI(
  task: ExtractedTask,
  projectContext: ProjectContext,
  markdownContext: string
): Promise<EnrichedTask> {
  try {
    const prompt = `Analyze this task extracted from a project's markdown file and provide:
1. An enhanced description explaining WHAT needs to be done and WHY it matters
2. Technical reasoning explaining the importance and impact of this task
3. Extrapolate additional context based on the project type and task details

Project: ${projectContext.name}
${projectContext.description ? `Description: ${projectContext.description}` : ''}
${projectContext.techStack ? `Tech Stack: ${projectContext.techStack.join(', ')}` : ''}

Task Title: ${task.title}
Source File: ${task.source}
Original Description: ${task.description || 'None'}

Surrounding Context from Markdown:
${markdownContext.slice(0, 1000)}

Provide your response in this exact format:
DESCRIPTION: [2-3 sentences explaining what needs to be done and why it's important]
REASONING: [2-3 sentences explaining the technical importance, potential impact, and priority rationale]`

    const response = await generateWithAI(
      'You are a technical project analyst helping to understand and prioritize software development tasks.',
      prompt,
      { maxTokens: 300 }
    )

    // Parse the response
    const responseText = response.text || String(response)
    const descMatch = responseText.match(/DESCRIPTION:\s*(.+?)(?=REASONING:|$)/s)
    const reasonMatch = responseText.match(/REASONING:\s*(.+?)$/s)

    const description = descMatch
      ? descMatch[1].trim()
      : `${task.title}. Extracted from ${task.source}.`
    const reasoning = reasonMatch
      ? reasonMatch[1].trim()
      : `Task identified in ${task.source} as part of project development goals.`

    return {
      title: task.title,
      description,
      reasoning,
      priority: task.priority,
    }
  } catch (error) {
    console.error('Failed to enrich task with AI:', error)
    // Fallback to basic task info
    return {
      title: task.title,
      description: task.description || `Extracted from ${task.source}`,
      reasoning: `Task extracted from ${task.source} as part of project development.`,
      priority: task.priority,
    }
  }
}

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

  // Get all active agents from database for this project
  const dbAgents = await prisma.agent.findMany({
    where: {
      projectId,
      isActive: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  // Convert database agents to the Agent format expected by task-generator
  const agents = dbAgents.map(agent => ({
    type: agent.type as 'marketing' | 'pricing' | 'competitor' | 'seo' | 'blogging' | 'technical' | 'pm',
    name: agent.name,
    description: agent.description,
    systemPrompt: agent.systemPrompt,
    taskCategories: JSON.parse(agent.taskCategories),
  }))

  // Run all agents in parallel
  console.log(`Running ${agents.length} agents...`)
  const agentAnalyses = await generateAllAgentTasks(agents, context)

  // Store insights
  for (const [agentType, agentAnalysis] of agentAnalyses) {
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
  }

  // Collect all agent tasks and prioritize them
  const MAX_TASKS = 50
  const allAgentTasks: Array<{
    agentType: string
    task: {
      title: string
      description: string
      priority: 'low' | 'medium' | 'high'
      reasoning: string
    }
    priorityScore: number
  }> = []

  for (const [agentType, agentAnalysis] of agentAnalyses) {
    for (const task of agentAnalysis.tasks) {
      // Calculate priority score (high=3, medium=2, low=1)
      const priorityScore = task.priority === 'high' ? 3 : task.priority === 'medium' ? 2 : 1
      allAgentTasks.push({ agentType, task, priorityScore })
    }
  }

  // Sort by priority (high first) and limit to MAX_TASKS
  allAgentTasks.sort((a, b) => b.priorityScore - a.priorityScore)
  const tasksToCreate = allAgentTasks.slice(0, MAX_TASKS)

  // Create tasks
  let taskOrder = 0
  for (const { agentType, task } of tasksToCreate) {
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

  // Extract tasks from markdown files (only if we have room)
  console.log('Extracting tasks from markdown files...')
  let markdownTaskCount = 0
  const remainingSlots = MAX_TASKS - tasksToCreate.length

  if (remainingSlots > 0) {
    try {
      const markdownTasks = await extractTasksFromProject(project.path)
      console.log(`Found ${markdownTasks.length} potential markdown tasks`)

      // Read markdown files to get context for AI enrichment
      const markdownFilesContent = new Map<string, string>()
      try {
        const readmePath = path.join(project.path, 'README.md')
        const readmeContent = await fs.readFile(readmePath, 'utf-8')
        markdownFilesContent.set('README.md', readmeContent)
      } catch {
        // README not found
      }

      // Prioritize markdown tasks (high priority first, uncompleted first)
      const sortedMdTasks = markdownTasks
        .filter(t => !t.isCompleted) // Only uncompleted tasks
        .sort((a, b) => {
          const priorityA = a.priority === 'high' ? 3 : a.priority === 'medium' ? 2 : 1
          const priorityB = b.priority === 'high' ? 3 : b.priority === 'medium' ? 2 : 1
          return priorityB - priorityA
        })
        .slice(0, Math.min(remainingSlots, 10)) // Max 10 markdown tasks

      for (const mdTask of sortedMdTasks) {
        // Check for duplicates
        const isDuplicate = await isDuplicateTask(projectId, mdTask.title)
        if (isDuplicate) {
          console.log(`Skipping duplicate task: ${mdTask.title}`)
          continue
        }

        // Get markdown context for AI enrichment
        const markdownContext = markdownFilesContent.get(mdTask.source) || ''

        // Enrich task with AI-generated description and reasoning
        console.log(`Enriching task: ${mdTask.title}`)
        const enrichedTask = await enrichTaskWithAI(mdTask, context, markdownContext)

        await prisma.task.create({
          data: {
            projectId,
            title: enrichedTask.title,
            description: enrichedTask.description,
            priority: enrichedTask.priority,
            status: 'todo',
            agentType: 'pm', // Assign to PM agent
            aiReasoning: enrichedTask.reasoning,
            order: taskOrder++,
          },
        })
        markdownTaskCount++
        console.log(`✓ Created enriched task: ${enrichedTask.title}`)
      }
      console.log(`Created ${markdownTaskCount} enriched tasks from markdown files`)
    } catch (error) {
      console.warn('Failed to extract markdown tasks:', error)
    }
  } else {
    console.log('Task limit reached, skipping markdown task extraction')
  }

  // Extract knowledge base documents from markdown files
  console.log('Extracting knowledge base documents from markdown files...')
  let kbDocCount = 0
  try {
    const kbDocuments = await extractKBDocumentsFromProject(project.path)
    console.log(`Found ${kbDocuments.length} knowledge base documents to process`)

    for (const kbDoc of kbDocuments) {
      console.log(`Processing KB document: ${kbDoc.title} (${kbDoc.source})`)

      // Generate unique slug
      const baseSlug = kbDoc.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      // Check if document with similar slug already exists for this project
      const existingDocs = await prisma.knowledgeBaseDocument.findMany({
        where: {
          projectId,
          slug: { startsWith: baseSlug }
        }
      })

      const slug = existingDocs.length > 0
        ? `${baseSlug}-${existingDocs.length}`
        : baseSlug

      // Generate AI summary
      console.log(`Generating summary for ${kbDoc.title}...`)
      const summary = await generateDocumentSummary(kbDoc.title, kbDoc.content)

      // Create or get tags
      const tagConnections = []
      for (const tagName of kbDoc.tags) {
        let tag = await prisma.knowledgeBaseTag.findUnique({
          where: { name: tagName }
        })

        if (!tag) {
          tag = await prisma.knowledgeBaseTag.create({
            data: { name: tagName }
          })
        }

        tagConnections.push({
          tag: { connect: { id: tag.id } }
        })
      }

      // Create knowledge base document
      await prisma.knowledgeBaseDocument.create({
        data: {
          title: kbDoc.title,
          content: kbDoc.content,
          summary,
          slug,
          projectId,
          source: 'markdown',
          tags: {
            create: tagConnections.map(tc => ({ tag: tc.tag }))
          }
        }
      })

      kbDocCount++
      console.log(`✓ Created KB document: ${kbDoc.title}`)
    }
    console.log(`Extracted ${kbDocCount} knowledge base documents from markdown files`)
  } catch (error) {
    console.warn('Failed to extract knowledge base documents:', error)
  }

  console.log(`Analysis complete for project ${projectId}`)

  const totalAgentTasksGenerated = Array.from(agentAnalyses.values()).reduce(
    (sum, a) => sum + a.tasks.length,
    0
  )

  return {
    analysis,
    agentCount: agents.length,
    totalTasks: tasksToCreate.length + markdownTaskCount,
    tasksCreated: tasksToCreate.length + markdownTaskCount,
    tasksAvailable: totalAgentTasksGenerated,
    taskLimitReached: totalAgentTasksGenerated > MAX_TASKS,
    agentTasks: tasksToCreate.length,
    markdownTasks: markdownTaskCount,
    kbDocuments: kbDocCount,
    totalInsights: Array.from(agentAnalyses.values()).reduce(
      (sum, a) => sum + a.insights.length,
      0
    ),
  }
}

async function buildProjectContext(project: {
  id: string
  name: string
  description?: string | null
  repoUrl?: string | null
  path: string
}): Promise<ProjectContext> {
  const context: ProjectContext = {
    name: project.name,
    description: project.description ?? undefined,
    repoUrl: project.repoUrl ?? undefined,
  }

  // Read README
  try {
    const readmePath = path.join(project.path, 'README.md')
    context.readme = await fs.readFile(readmePath, 'utf-8')
  } catch {
    // README not found or not readable
  }

  // Read package.json for dependency analysis
  try {
    const packageJsonPath = path.join(project.path, 'package.json')
    const packageContent = await fs.readFile(packageJsonPath, 'utf-8')
    context.packageJson = JSON.parse(packageContent)
  } catch {
    // package.json not found or not readable
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
  } catch (_error) {
    return 'Unable to read project structure'
  }
}

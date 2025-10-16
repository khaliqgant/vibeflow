/**
 * Integration tests for the full project analysis workflow
 */

import { orchestrateProjectAnalysis } from '../../lib/agents/orchestrator'
import { PrismaClient } from '@prisma/client'

// Mock external dependencies
jest.mock('../../lib/ai/provider')
jest.mock('../../lib/github/client')
jest.mock('fs/promises')

const prisma = new PrismaClient()

describe('Project Analysis Integration', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.task.deleteMany()
    await prisma.projectInsight.deleteMany()
    await prisma.project.deleteMany()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('should complete full analysis workflow', async () => {
    // Create test project
    const project = await prisma.project.create({
      data: {
        name: 'Test Project',
        path: '/test/path',
        description: 'Integration test project',
      },
    })

    // Mock AI responses
    const { generateWithAI } = require('../../lib/ai/provider')
    generateWithAI.mockResolvedValue({
      text: JSON.stringify({
        summary: 'Test project summary',
        techStack: ['typescript', 'react'],
        projectType: 'web app',
        strengths: ['Good code structure'],
        recommendations: ['Add more tests'],
      }),
    })

    // Mock GitHub responses
    const { parseGitHubUrl, getOpenPRs, getOpenIssues } = require('../../lib/github/client')
    parseGitHubUrl.mockReturnValue({ owner: 'test', repo: 'repo' })
    getOpenPRs.mockResolvedValue([])
    getOpenIssues.mockResolvedValue([])

    // Mock file system
    const fs = require('fs/promises')
    fs.readFile.mockResolvedValue('# Test Project\n\nA test project')
    fs.readdir.mockResolvedValue([])

    // Run orchestration
    const result = await orchestrateProjectAnalysis(project.id)

    expect(result).toHaveProperty('analysis')
    expect(result).toHaveProperty('agentCount', 7)
    expect(result.totalTasks).toBeGreaterThan(0)

    // Verify project was updated
    const updatedProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: { tasks: true, insights: true },
    })

    expect(updatedProject?.aiAnalysis).toBeDefined()
    expect(updatedProject?.techStack).toBeDefined()
    expect(updatedProject?.lastAnalyzedAt).toBeDefined()
  })

  it('should create tasks from multiple agents', async () => {
    const project = await prisma.project.create({
      data: {
        name: 'Multi-Agent Test',
        path: '/test/path',
      },
    })

    const { generateWithAI } = require('../../lib/ai/provider')

    // Mock different responses for each agent
    let callCount = 0
    generateWithAI.mockImplementation(() => {
      callCount++
      return Promise.resolve({
        text: JSON.stringify({
          insights: [`Insight ${callCount}`],
          tasks: [
            {
              title: `Task ${callCount}`,
              description: `Description ${callCount}`,
              priority: 'medium',
              reasoning: `Reasoning ${callCount}`,
            },
          ],
          recommendations: [`Recommendation ${callCount}`],
        }),
      })
    })

    const fs = require('fs/promises')
    fs.readFile.mockResolvedValue('# Test')
    fs.readdir.mockResolvedValue([])

    await orchestrateProjectAnalysis(project.id)

    const tasks = await prisma.task.findMany({
      where: { projectId: project.id },
    })

    // Should have tasks from multiple agents
    expect(tasks.length).toBeGreaterThan(1)

    // Check that different agent types are represented
    const agentTypes = new Set(tasks.map(t => t.agentType))
    expect(agentTypes.size).toBeGreaterThan(1)
  })

  it('should handle projects without README', async () => {
    const project = await prisma.project.create({
      data: {
        name: 'No README Project',
        path: '/test/path',
      },
    })

    const { generateWithAI } = require('../../lib/ai/provider')
    generateWithAI.mockResolvedValue({
      text: JSON.stringify({
        summary: 'Project without README',
        techStack: [],
        projectType: 'unknown',
        strengths: [],
        recommendations: ['Add README'],
      }),
    })

    const fs = require('fs/promises')
    fs.readFile.mockRejectedValue(new Error('File not found'))
    fs.readdir.mockResolvedValue([])

    await expect(orchestrateProjectAnalysis(project.id)).resolves.not.toThrow()

    const updatedProject = await prisma.project.findUnique({
      where: { id: project.id },
    })

    expect(updatedProject?.aiAnalysis).toBeDefined()
  })

  it('should store insights from agents', async () => {
    const project = await prisma.project.create({
      data: {
        name: 'Insights Test',
        path: '/test/path',
      },
    })

    const { generateWithAI } = require('../../lib/ai/provider')
    generateWithAI.mockResolvedValue({
      text: JSON.stringify({
        insights: ['Insight 1', 'Insight 2', 'Insight 3'],
        tasks: [],
        recommendations: [],
      }),
    })

    const fs = require('fs/promises')
    fs.readFile.mockResolvedValue('# Test')
    fs.readdir.mockResolvedValue([])

    await orchestrateProjectAnalysis(project.id)

    const insights = await prisma.projectInsight.findMany({
      where: { projectId: project.id },
    })

    expect(insights.length).toBeGreaterThan(0)
    expect(insights[0]).toHaveProperty('agentType')
    expect(insights[0]).toHaveProperty('content')
  })
})

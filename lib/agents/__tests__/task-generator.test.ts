import { generateTasksWithAgent, generateAllAgentTasks } from '../task-generator'
import { Agent, ProjectContext } from '../types'
import * as claudeModule from '../../ai/claude'

// Mock the AI module
jest.mock('../../ai/claude', () => ({
  analyzeWithClaude: jest.fn(),
}))

const mockAgent: Agent = {
  type: 'technical',
  name: 'Technical Reviewer',
  description: 'Reviews code',
  systemPrompt: 'You are a technical reviewer',
  taskCategories: ['code-quality', 'testing'],
}

const mockContext: ProjectContext = {
  name: 'Test Project',
  description: 'A test project',
  readme: '# Test Project\n\nThis is a test.',
  repoUrl: 'https://github.com/test/repo',
  techStack: ['typescript', 'react'],
}

describe('Task Generator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateTasksWithAgent', () => {
    it('should generate tasks from agent analysis', async () => {
      const analyzeWithClaude = claudeModule.analyzeWithClaude as jest.MockedFunction<typeof claudeModule.analyzeWithClaude>
      const mockResponse = JSON.stringify({
        insights: ['Insight 1', 'Insight 2'],
        tasks: [
          {
            title: 'Improve test coverage',
            description: 'Add more unit tests',
            priority: 'high',
            reasoning: 'Better code quality',
          },
        ],
        recommendations: ['Use TypeScript', 'Add CI/CD'],
      })

      analyzeWithClaude.mockResolvedValue(mockResponse)

      const result = await generateTasksWithAgent(mockAgent, mockContext)

      expect(result).toHaveProperty('agentType', 'technical')
      expect(result.insights).toHaveLength(2)
      expect(result.tasks).toHaveLength(1)
      expect(result.tasks[0].title).toBe('Improve test coverage')
      expect(result.recommendations).toHaveLength(2)
    })

    it('should handle invalid JSON response gracefully', async () => {
      const analyzeWithClaude = claudeModule.analyzeWithClaude as jest.MockedFunction<typeof claudeModule.analyzeWithClaude>
      analyzeWithClaude.mockResolvedValue('Invalid JSON response')

      const result = await generateTasksWithAgent(mockAgent, mockContext)

      expect(result.agentType).toBe('technical')
      expect(result.insights).toHaveLength(1)
      expect(result.insights[0]).toContain('unexpected')
      expect(result.tasks).toHaveLength(0)
    })

    it('should include project context in prompt', async () => {
      const analyzeWithClaude = claudeModule.analyzeWithClaude as jest.MockedFunction<typeof claudeModule.analyzeWithClaude>
      analyzeWithClaude.mockResolvedValue('{}')

      await generateTasksWithAgent(mockAgent, mockContext)

      const callArgs = analyzeWithClaude.mock.calls[0]
      expect(callArgs[0]).toBe(mockAgent.systemPrompt)
      expect(callArgs[1]).toContain('Test Project')
      expect(callArgs[1]).toContain('typescript')
    })

    it('should set appropriate maxTokens', async () => {
      const analyzeWithClaude = claudeModule.analyzeWithClaude as jest.MockedFunction<typeof claudeModule.analyzeWithClaude>
      analyzeWithClaude.mockResolvedValue('{}')

      await generateTasksWithAgent(mockAgent, mockContext)

      const options = analyzeWithClaude.mock.calls[0][2]
      expect(options.maxTokens).toBe(3000)
    })
  })

  describe('generateAllAgentTasks', () => {
    it('should run all agents in parallel', async () => {
      const analyzeWithClaude = claudeModule.analyzeWithClaude as jest.MockedFunction<typeof claudeModule.analyzeWithClaude>
      analyzeWithClaude.mockResolvedValue(
        JSON.stringify({
          insights: ['Test insight'],
          tasks: [],
          recommendations: [],
        })
      )

      const agents = [
        { ...mockAgent, type: 'technical' as const },
        { ...mockAgent, type: 'marketing' as const, name: 'Marketing' },
        { ...mockAgent, type: 'pm' as const, name: 'PM' },
      ]

      const results = await generateAllAgentTasks(agents, mockContext)

      expect(results.size).toBe(3)
      expect(results.has('technical')).toBe(true)
      expect(results.has('marketing')).toBe(true)
      expect(results.has('pm')).toBe(true)
      expect(analyzeWithClaude).toHaveBeenCalledTimes(3)
    })

    it('should handle errors in individual agents', async () => {
      const analyzeWithClaude = claudeModule.analyzeWithClaude as jest.MockedFunction<typeof claudeModule.analyzeWithClaude>
      analyzeWithClaude.mockRejectedValueOnce(new Error('API Error'))
      analyzeWithClaude.mockResolvedValueOnce('{}')

      const agents = [
        { ...mockAgent, type: 'technical' as const },
        { ...mockAgent, type: 'marketing' as const },
      ]

      await expect(generateAllAgentTasks(agents, mockContext)).rejects.toThrow()
    })

    it('should return map with agent types as keys', async () => {
      const analyzeWithClaude = claudeModule.analyzeWithClaude as jest.MockedFunction<typeof claudeModule.analyzeWithClaude>
      analyzeWithClaude.mockResolvedValue('{"insights":[],"tasks":[],"recommendations":[]}')

      const agents = [{ ...mockAgent, type: 'technical' as const }]
      const results = await generateAllAgentTasks(agents, mockContext)

      expect(results instanceof Map).toBe(true)
      const analysis = results.get('technical')
      expect(analysis).toBeDefined()
      expect(analysis?.agentType).toBe('technical')
    })
  })
})

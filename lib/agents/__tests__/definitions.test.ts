import { agents, getAgent, getAllAgents } from '../definitions'

describe('Agent Definitions', () => {
  describe('agents object', () => {
    it('should have all 7 agents defined', () => {
      const agentTypes = Object.keys(agents)
      expect(agentTypes).toHaveLength(7)
      expect(agentTypes).toContain('marketing')
      expect(agentTypes).toContain('pricing')
      expect(agentTypes).toContain('competitor')
      expect(agentTypes).toContain('seo')
      expect(agentTypes).toContain('blogging')
      expect(agentTypes).toContain('technical')
      expect(agentTypes).toContain('pm')
    })

    it('should have proper structure for each agent', () => {
      Object.values(agents).forEach(agent => {
        expect(agent).toHaveProperty('type')
        expect(agent).toHaveProperty('name')
        expect(agent).toHaveProperty('description')
        expect(agent).toHaveProperty('systemPrompt')
        expect(agent).toHaveProperty('taskCategories')
        expect(Array.isArray(agent.taskCategories)).toBe(true)
        expect(agent.systemPrompt.length).toBeGreaterThan(50)
      })
    })

    it('should have unique agent types', () => {
      const types = Object.values(agents).map(a => a.type)
      const uniqueTypes = new Set(types)
      expect(uniqueTypes.size).toBe(types.length)
    })

    it('should have non-empty task categories', () => {
      Object.values(agents).forEach(agent => {
        expect(agent.taskCategories.length).toBeGreaterThan(0)
      })
    })
  })

  describe('getAgent', () => {
    it('should return correct agent by type', () => {
      const marketingAgent = getAgent('marketing')
      expect(marketingAgent).toBeDefined()
      expect(marketingAgent?.type).toBe('marketing')
      expect(marketingAgent?.name).toBe('Marketing Strategist')
    })

    it('should return undefined for invalid type', () => {
      const invalid = getAgent('invalid')
      expect(invalid).toBeUndefined()
    })

    it('should work for all valid agent types', () => {
      const types = ['marketing', 'pricing', 'competitor', 'seo', 'blogging', 'technical', 'pm']
      types.forEach(type => {
        const agent = getAgent(type)
        expect(agent).toBeDefined()
        expect(agent?.type).toBe(type)
      })
    })
  })

  describe('getAllAgents', () => {
    it('should return array of all agents', () => {
      const allAgents = getAllAgents()
      expect(Array.isArray(allAgents)).toBe(true)
      expect(allAgents).toHaveLength(7)
    })

    it('should return agents with all required fields', () => {
      const allAgents = getAllAgents()
      allAgents.forEach(agent => {
        expect(agent.type).toBeDefined()
        expect(agent.name).toBeDefined()
        expect(agent.description).toBeDefined()
        expect(agent.systemPrompt).toBeDefined()
        expect(agent.taskCategories).toBeDefined()
      })
    })
  })

  describe('Agent specifics', () => {
    it('marketing agent should have correct properties', () => {
      const marketing = agents.marketing
      expect(marketing.name).toBe('Marketing Strategist')
      expect(marketing.description).toContain('marketing')
      expect(marketing.systemPrompt).toContain('marketing')
      expect(marketing.taskCategories).toContain('product-launch')
    })

    it('technical agent should have correct properties', () => {
      const technical = agents.technical
      expect(technical.name).toBe('Technical Reviewer')
      expect(technical.description).toContain('code')
      expect(technical.systemPrompt).toContain('engineer')
      expect(technical.taskCategories).toContain('code-quality')
    })

    it('pm agent should have correct properties', () => {
      const pm = agents.pm
      expect(pm.name).toBe('Project Manager')
      expect(pm.description).toContain('project')
      expect(pm.systemPrompt).toContain('project manager')
      expect(pm.taskCategories).toContain('planning')
    })
  })
})

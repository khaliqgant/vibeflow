import {
  getDefaultProvider,
  getDefaultModel,
  generateWithAI,
  AIProvider,
} from '../provider'

// Mock the AI SDKs
jest.mock('@anthropic-ai/sdk')
jest.mock('openai')

describe('AI Provider', () => {
  describe('getDefaultProvider', () => {
    it('should return claude as default', () => {
      delete process.env.AI_PROVIDER
      expect(getDefaultProvider()).toBe('claude')
    })

    it('should return openai when env is set', () => {
      process.env.AI_PROVIDER = 'openai'
      expect(getDefaultProvider()).toBe('openai')
    })

    it('should handle case insensitive provider names', () => {
      process.env.AI_PROVIDER = 'OPENAI'
      expect(getDefaultProvider()).toBe('openai')
    })
  })

  describe('getDefaultModel', () => {
    it('should return correct Claude model', () => {
      const model = getDefaultModel('claude')
      expect(model).toBe('claude-3-5-sonnet-20241022')
    })

    it('should return correct OpenAI model', () => {
      const model = getDefaultModel('openai')
      expect(model).toBe('gpt-4-turbo-preview')
    })

    it('should use custom model from env for Claude', () => {
      process.env.ANTHROPIC_MODEL = 'claude-3-opus-20240229'
      const model = getDefaultModel('claude')
      expect(model).toBe('claude-3-opus-20240229')
      delete process.env.ANTHROPIC_MODEL
    })

    it('should use custom model from env for OpenAI', () => {
      process.env.OPENAI_MODEL = 'gpt-4'
      const model = getDefaultModel('openai')
      expect(model).toBe('gpt-4')
      delete process.env.OPENAI_MODEL
    })
  })

  describe('generateWithAI', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should use Claude by default', async () => {
      delete process.env.AI_PROVIDER

      const Anthropic = require('@anthropic-ai/sdk').default
      const mockCreate = jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Test response' }],
      })
      Anthropic.mockImplementation(() => ({
        messages: { create: mockCreate },
      }))

      const result = await generateWithAI('system', 'user')

      expect(result.text).toBe('Test response')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          system: 'system',
          messages: [{ role: 'user', content: 'user' }],
        })
      )
    })

    it('should use OpenAI when specified', async () => {
      const OpenAI = require('openai').default
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [{ message: { content: 'OpenAI response' } }],
      })
      OpenAI.mockImplementation(() => ({
        chat: { completions: { create: mockCreate } },
      }))

      const result = await generateWithAI('system', 'user', { provider: 'openai' })

      expect(result.text).toBe('OpenAI response')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            { role: 'system', content: 'system' },
            { role: 'user', content: 'user' },
          ],
        })
      )
    })

    it('should respect custom model parameter', async () => {
      const Anthropic = require('@anthropic-ai/sdk').default
      const mockCreate = jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Test' }],
      })
      Anthropic.mockImplementation(() => ({
        messages: { create: mockCreate },
      }))

      await generateWithAI('system', 'user', { model: 'custom-model' })

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'custom-model',
        })
      )
    })

    it('should respect custom maxTokens parameter', async () => {
      const Anthropic = require('@anthropic-ai/sdk').default
      const mockCreate = jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Test' }],
      })
      Anthropic.mockImplementation(() => ({
        messages: { create: mockCreate },
      }))

      await generateWithAI('system', 'user', { maxTokens: 2000 })

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 2000,
        })
      )
    })
  })
})

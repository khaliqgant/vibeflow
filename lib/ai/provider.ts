import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

export type AIProvider = 'claude' | 'openai'

export interface AIResponse {
  text: string
}

export interface AIConfig {
  provider: AIProvider
  model?: string
  maxTokens?: number
}

// Check if an API key is valid (not empty and not a placeholder)
function isValidApiKey(key: string | undefined): boolean {
  if (!key || key.trim() === '') return false
  // Check for common placeholder values
  const placeholders = ['your_', 'replace_', 'insert_', 'add_']
  return !placeholders.some(p => key.toLowerCase().startsWith(p))
}

// Get AI provider from environment or default based on available API keys
export function getDefaultProvider(): AIProvider {
  // Check explicit provider setting first
  const provider = process.env.AI_PROVIDER?.toLowerCase()
  if (provider === 'openai' || provider === 'claude') {
    return provider as AIProvider
  }

  // Auto-detect based on valid API keys
  const hasAnthropicKey = isValidApiKey(process.env.ANTHROPIC_API_KEY)
  const hasOpenAIKey = isValidApiKey(process.env.OPENAI_API_KEY)

  // Prefer OpenAI if Anthropic key is missing
  if (!hasAnthropicKey && hasOpenAIKey) {
    return 'openai'
  }

  // Default to Claude (original behavior)
  return 'claude'
}

// Get model name for the provider
export function getDefaultModel(provider: AIProvider): string {
  if (provider === 'openai') {
    return process.env.OPENAI_MODEL || 'gpt-4o'
  }
  return process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'
}

export async function generateWithAI(
  systemPrompt: string,
  userPrompt: string,
  config?: Partial<AIConfig>
): Promise<AIResponse> {
  const provider = config?.provider || getDefaultProvider()
  const model = config?.model || getDefaultModel(provider)
  const maxTokens = config?.maxTokens || 4096

  try {
    if (provider === 'openai') {
      return await generateWithOpenAI(systemPrompt, userPrompt, model, maxTokens)
    } else {
      return await generateWithClaude(systemPrompt, userPrompt, model, maxTokens)
    }
  } catch (error: any) {
    // If authentication fails, try the other provider as fallback
    const isAuthError = error?.message?.includes('authentication') ||
                        error?.message?.includes('401') ||
                        error?.message?.includes('invalid x-api-key') ||
                        error?.message?.includes('Incorrect API key')

    if (isAuthError) {
      console.warn(`${provider} authentication failed, falling back to alternate provider`)

      // Try the other provider
      const fallbackProvider: AIProvider = provider === 'openai' ? 'claude' : 'openai'
      const fallbackModel = getDefaultModel(fallbackProvider)

      // Check if fallback provider has a valid key
      const fallbackKey = fallbackProvider === 'openai'
        ? process.env.OPENAI_API_KEY
        : process.env.ANTHROPIC_API_KEY

      if (!isValidApiKey(fallbackKey)) {
        throw new Error(`No valid API keys available. Please set either ANTHROPIC_API_KEY or OPENAI_API_KEY`)
      }

      if (fallbackProvider === 'openai') {
        return await generateWithOpenAI(systemPrompt, userPrompt, fallbackModel, maxTokens)
      } else {
        return await generateWithClaude(systemPrompt, userPrompt, fallbackModel, maxTokens)
      }
    }

    throw error
  }
}

async function generateWithClaude(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  maxTokens: number
): Promise<AIResponse> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  })

  const message = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  })

  const textContent = message.content.find((block) => block.type === 'text')
  const text = textContent && 'text' in textContent ? textContent.text : ''

  return { text }
}

async function generateWithOpenAI(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  maxTokens: number
): Promise<AIResponse> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
  })

  const completion = await openai.chat.completions.create({
    model,
    max_tokens: maxTokens,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  })

  const text = completion.choices[0]?.message?.content || ''

  return { text }
}

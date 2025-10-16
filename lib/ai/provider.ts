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

// Get AI provider from environment or default to Claude
export function getDefaultProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER?.toLowerCase()
  if (provider === 'openai') return 'openai'
  return 'claude'
}

// Get model name for the provider
export function getDefaultModel(provider: AIProvider): string {
  if (provider === 'openai') {
    return process.env.OPENAI_MODEL || 'gpt-4-turbo-preview'
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

  if (provider === 'openai') {
    return await generateWithOpenAI(systemPrompt, userPrompt, model, maxTokens)
  } else {
    return await generateWithClaude(systemPrompt, userPrompt, model, maxTokens)
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

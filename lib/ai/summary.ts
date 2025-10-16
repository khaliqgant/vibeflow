import { generateWithAI } from './provider'

/**
 * Generate a concise summary of a knowledge base document
 * @param content The full markdown content of the document
 * @returns A 2-3 sentence summary of the document
 */
export async function generateKBSummary(content: string): Promise<string> {
  // Truncate content if it's very long to avoid token limits
  const truncatedContent = content.length > 8000
    ? content.slice(0, 8000) + '\n\n[Content truncated...]'
    : content

  const systemPrompt = `You are a technical documentation summarizer. Your job is to read documentation and create concise, informative summaries that help developers quickly understand what the document contains.

Guidelines:
- Create a 2-3 sentence summary
- Focus on the main purpose and key takeaways
- Use clear, professional language
- Avoid fluff and unnecessary details
- Highlight practical information (what it does, how to use it, when to use it)`

  const userPrompt = `Please provide a concise 2-3 sentence summary of the following documentation:

---
${truncatedContent}
---

Summary:`

  try {
    const response = await generateWithAI(systemPrompt, userPrompt, {
      maxTokens: 500,
    })

    return response.text.trim()
  } catch (error) {
    console.error('Failed to generate summary:', error)
    throw new Error('Failed to generate AI summary')
  }
}

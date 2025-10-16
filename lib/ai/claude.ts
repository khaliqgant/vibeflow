import { generateWithAI } from './provider'

export async function analyzeWithClaude(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    model?: string
    maxTokens?: number
  }
): Promise<string> {
  const response = await generateWithAI(systemPrompt, userPrompt, {
    model: options?.model,
    maxTokens: options?.maxTokens,
  })
  return response.text
}

export async function analyzeProject(context: {
  name: string
  description?: string
  readme?: string
  codeStructure?: string
  repoUrl?: string
}): Promise<{
  summary: string
  techStack: string[]
  projectType: string
  strengths: string[]
  recommendations: string[]
}> {
  const systemPrompt = `You are an expert software project analyst. Analyze projects comprehensively, identifying technology stack, architecture patterns, strengths, and improvement opportunities.`

  const userPrompt = `Analyze this project:

**Project Name:** ${context.name}
**Description:** ${context.description || 'Not provided'}
**Repository:** ${context.repoUrl || 'Not provided'}

**README Content:**
${context.readme || 'No README available'}

**Code Structure:**
${context.codeStructure || 'Not analyzed'}

Please provide:
1. A brief summary of what this project does
2. Identified tech stack (as JSON array)
3. Project type (e.g., web app, library, CLI tool, etc.)
4. Key strengths
5. Recommendations for improvement

Format your response as JSON:
{
  "summary": "...",
  "techStack": ["tech1", "tech2"],
  "projectType": "...",
  "strengths": ["strength1", "strength2"],
  "recommendations": ["rec1", "rec2"]
}`

  const response = await analyzeWithClaude(systemPrompt, userPrompt)

  try {
    // Try to parse JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (e) {
    // Fallback if JSON parsing fails
  }

  return {
    summary: response.slice(0, 500),
    techStack: [],
    projectType: 'unknown',
    strengths: [],
    recommendations: [],
  }
}

export async function analyzeCode(
  filePaths: string[],
  fileContents: string[]
): Promise<string> {
  const systemPrompt = `You are a senior software engineer reviewing code. Provide concise, actionable feedback.`

  const userPrompt = `Review these code files and provide insights:

${filePaths.map((path, i) => `
**File: ${path}**
\`\`\`
${fileContents[i].slice(0, 2000)}
\`\`\`
`).join('\n')}

Provide a brief analysis focusing on:
- Code quality and patterns
- Potential issues or improvements
- Architecture observations`

  return await analyzeWithClaude(systemPrompt, userPrompt, { maxTokens: 2048 })
}

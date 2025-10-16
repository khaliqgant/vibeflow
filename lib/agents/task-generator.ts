import { analyzeWithClaude } from '../ai/claude'
import { Agent, AgentAnalysis, ProjectContext } from './types'

export async function generateTasksWithAgent(
  agent: Agent,
  context: ProjectContext
): Promise<AgentAnalysis> {
  const userPrompt = buildPromptForAgent(agent, context)

  const response = await analyzeWithClaude(agent.systemPrompt, userPrompt, {
    maxTokens: 3000,
  })

  return parseAgentResponse(agent.type, response)
}

function buildPromptForAgent(agent: Agent, context: ProjectContext): string {
  let prompt = `Analyze this project from your expertise perspective:

**Project:** ${context.name}
**Description:** ${context.description || 'Not provided'}
**Repository:** ${context.repoUrl || 'Not provided'}

`

  if (context.readme) {
    prompt += `**README:**
${context.readme.slice(0, 3000)}

`
  }

  if (context.techStack && context.techStack.length > 0) {
    prompt += `**Tech Stack:** ${context.techStack.join(', ')}

`
  }

  if (context.codeStructure) {
    prompt += `**Code Structure:**
${context.codeStructure}

`
  }

  if (context.openPRs && context.openPRs.length > 0) {
    prompt += `**Open Pull Requests (${context.openPRs.length}):**
${context.openPRs.slice(0, 5).map(pr => `- #${pr.number}: ${pr.title}`).join('\n')}

`
  }

  if (context.openIssues && context.openIssues.length > 0) {
    prompt += `**Open Issues (${context.openIssues.length}):**
${context.openIssues.slice(0, 5).map(issue => `- #${issue.number}: ${issue.title}`).join('\n')}

`
  }

  prompt += `Based on your analysis, provide:

1. **Key Insights** - 2-4 specific observations about this project from your ${agent.name} perspective
2. **Actionable Tasks** - 3-7 concrete tasks that should be added to the project board
3. **Recommendations** - High-level strategic recommendations

Format your response as JSON:
{
  "insights": ["insight1", "insight2", ...],
  "tasks": [
    {
      "title": "Task title",
      "description": "Detailed description",
      "priority": "high|medium|low",
      "reasoning": "Why this task is important"
    }
  ],
  "recommendations": ["rec1", "rec2", ...]
}

Be specific and actionable. Focus on tasks that can be worked on immediately.`

  return prompt
}

function parseAgentResponse(agentType: string, response: string): AgentAnalysis {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        agentType: agentType as any,
        insights: parsed.insights || [],
        tasks: parsed.tasks || [],
        recommendations: parsed.recommendations || [],
      }
    }
  } catch (e) {
    console.error('Failed to parse agent response:', e)
  }

  // Fallback: return empty analysis
  return {
    agentType: agentType as any,
    insights: ['Analysis completed but response format was unexpected'],
    tasks: [],
    recommendations: [],
  }
}

export async function generateAllAgentTasks(
  agents: Agent[],
  context: ProjectContext
): Promise<Map<string, AgentAnalysis>> {
  const results = new Map<string, AgentAnalysis>()

  // Run all agents in parallel
  const analyses = await Promise.all(
    agents.map(agent => generateTasksWithAgent(agent, context))
  )

  agents.forEach((agent, index) => {
    results.set(agent.type, analyses[index])
  })

  return results
}

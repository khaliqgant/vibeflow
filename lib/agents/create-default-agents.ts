import { prisma } from '../prisma'
import { agents } from './definitions'

function getAgentIcon(type: string): string {
  const iconMap: Record<string, string> = {
    marketing: '📢',
    pricing: '💰',
    competitor: '⚔️',
    seo: '🔍',
    blogging: '✍️',
    technical: '⚙️',
    pm: '📋',
  }
  return iconMap[type] || '🤖'
}

export async function createDefaultAgentsForProject(projectId: string) {
  const createdAgents = []

  for (const [_type, agent] of Object.entries(agents)) {
    // Check if this agent already exists for this project
    const existingAgent = await prisma.agent.findFirst({
      where: {
        projectId,
        type: agent.type,
      },
    })

    if (!existingAgent) {
      const newAgent = await prisma.agent.create({
        data: {
          type: agent.type,
          name: agent.name,
          icon: getAgentIcon(agent.type),
          description: agent.description,
          systemPrompt: agent.systemPrompt,
          taskCategories: JSON.stringify(agent.taskCategories),
          isDefault: true,
          isActive: true,
          projectId,
        },
      })
      createdAgents.push(newAgent)
    }
  }

  return createdAgents
}

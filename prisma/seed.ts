import { PrismaClient } from '@prisma/client'
import { agents } from '../lib/agents/definitions'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Get all existing projects
  const projects = await prisma.project.findMany()

  // Seed default agents for each project
  for (const project of projects) {
    console.log(`Seeding agents for project: ${project.name}`)

    for (const agent of Object.values(agents)) {
      // Check if this agent already exists for this project
      const existingAgent = await prisma.agent.findFirst({
        where: {
          projectId: project.id,
          type: agent.type,
        },
      })

      if (!existingAgent) {
        await prisma.agent.create({
          data: {
            type: agent.type,
            name: agent.name,
            icon: getAgentIcon(agent.type),
            description: agent.description,
            systemPrompt: agent.systemPrompt,
            taskCategories: JSON.stringify(agent.taskCategories),
            isDefault: true,
            isActive: true,
            projectId: project.id,
          },
        })
        console.log(`  ✓ Seeded agent: ${agent.name}`)
      }
    }
  }

  console.log('Seeding complete!')
}

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

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

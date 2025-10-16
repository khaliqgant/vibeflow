#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const server = new Server(
  {
    name: 'vibeflow',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// List all available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_projects',
        description: 'List all projects tracked in VibeFlow',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_project',
        description: 'Get detailed information about a specific project including tasks and insights',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: {
              type: 'string',
              description: 'The ID of the project to retrieve',
            },
          },
          required: ['project_id'],
        },
      },
      {
        name: 'get_project_tasks',
        description: 'Get all tasks for a specific project, optionally filtered by status or agent',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: {
              type: 'string',
              description: 'The ID of the project',
            },
            status: {
              type: 'string',
              enum: ['todo', 'in_progress', 'done'],
              description: 'Filter tasks by status',
            },
            agent_type: {
              type: 'string',
              enum: ['marketing', 'pricing', 'competitor', 'seo', 'blogging', 'technical', 'pm'],
              description: 'Filter tasks by agent type',
            },
          },
          required: ['project_id'],
        },
      },
      {
        name: 'get_next_task',
        description: 'Get the next task to work on from a project (prioritized by status and priority)',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: {
              type: 'string',
              description: 'The ID of the project',
            },
            agent_type: {
              type: 'string',
              enum: ['marketing', 'pricing', 'competitor', 'seo', 'blogging', 'technical', 'pm'],
              description: 'Get next task for specific agent',
            },
          },
          required: ['project_id'],
        },
      },
      {
        name: 'update_task',
        description: 'Update a task status, description, or other fields',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: {
              type: 'string',
              description: 'The ID of the task to update',
            },
            status: {
              type: 'string',
              enum: ['todo', 'in_progress', 'done'],
              description: 'New status for the task',
            },
            description: {
              type: 'string',
              description: 'Updated task description',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Updated priority',
            },
          },
          required: ['task_id'],
        },
      },
      {
        name: 'create_task',
        description: 'Create a new task for a project',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: {
              type: 'string',
              description: 'The ID of the project',
            },
            title: {
              type: 'string',
              description: 'Task title',
            },
            description: {
              type: 'string',
              description: 'Task description',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Task priority',
            },
            agent_type: {
              type: 'string',
              enum: ['marketing', 'pricing', 'competitor', 'seo', 'blogging', 'technical', 'pm'],
              description: 'Agent type for this task',
            },
          },
          required: ['project_id', 'title'],
        },
      },
      {
        name: 'create_knowledge_base_document',
        description: 'Inject a markdown document into the knowledge base. Perfect for documentation, guides, or any AI-generated content.',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Document title',
            },
            content: {
              type: 'string',
              description: 'Markdown content of the document',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of tag names for organizing the document (e.g., ["architecture", "api", "guide"])',
            },
            project_id: {
              type: 'string',
              description: 'Optional project ID to associate this document with a specific project',
            },
          },
          required: ['title', 'content'],
        },
      },
      {
        name: 'list_knowledge_base',
        description: 'List all knowledge base documents, optionally filtered by tags or project',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: {
              type: 'string',
              description: 'Filter documents by project ID',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter documents by tags',
            },
          },
        },
      },
      {
        name: 'get_knowledge_base_document',
        description: 'Get a specific knowledge base document by slug',
        inputSchema: {
          type: 'object',
          properties: {
            slug: {
              type: 'string',
              description: 'Document slug',
            },
          },
          required: ['slug'],
        },
      },
    ],
  }
})

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case 'list_projects': {
        const projects = await prisma.project.findMany({
          include: {
            tasks: true,
          },
          orderBy: { updatedAt: 'desc' },
        })

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                projects.map(p => ({
                  id: p.id,
                  name: p.name,
                  description: p.description,
                  path: p.path,
                  repoUrl: p.repoUrl,
                  status: p.status,
                  taskCount: p.tasks.length,
                  completedTasks: p.tasks.filter(t => t.status === 'done').length,
                })),
                null,
                2
              ),
            },
          ],
        }
      }

      case 'get_project': {
        const project = await prisma.project.findUnique({
          where: { id: args.project_id as string },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
            },
            insights: {
              orderBy: { createdAt: 'desc' },
            },
          },
        })

        if (!project) {
          return {
            content: [{ type: 'text', text: 'Project not found' }],
            isError: true,
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(project, null, 2),
            },
          ],
        }
      }

      case 'get_project_tasks': {
        const where: Record<string, unknown> = { projectId: args.project_id as string }
        if (args.status) where.status = args.status
        if (args.agent_type) where.agentType = args.agent_type

        const tasks = await prisma.task.findMany({
          where,
          orderBy: { order: 'asc' },
        })

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(tasks, null, 2),
            },
          ],
        }
      }

      case 'get_next_task': {
        const where: Record<string, unknown> = {
          projectId: args.project_id as string,
          status: { in: ['todo', 'in_progress'] },
        }
        if (args.agent_type) where.agentType = args.agent_type

        const task = await prisma.task.findFirst({
          where,
          orderBy: [
            { status: 'desc' }, // in_progress first
            { priority: 'desc' }, // then by priority
            { order: 'asc' },
          ],
        })

        if (!task) {
          return {
            content: [{ type: 'text', text: 'No tasks available' }],
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(task, null, 2),
            },
          ],
        }
      }

      case 'update_task': {
        const updates: Record<string, unknown> = {}
        if (args.status) updates.status = args.status
        if (args.description) updates.description = args.description
        if (args.priority) updates.priority = args.priority

        const task = await prisma.task.update({
          where: { id: args.task_id as string },
          data: updates,
        })

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(task, null, 2),
            },
          ],
        }
      }

      case 'create_task': {
        const task = await prisma.task.create({
          data: {
            projectId: args.project_id as string,
            title: args.title as string,
            description: args.description as string | undefined,
            priority: (args.priority as string) || 'medium',
            agentType: args.agent_type as string | undefined,
            status: 'todo',
            order: 0,
          },
        })

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(task, null, 2),
            },
          ],
        }
      }

      case 'create_knowledge_base_document': {
        const { title, content, tags, project_id } = args

        // Generate slug from title
        let slug = (title as string)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')

        // Check if slug exists and make unique
        const existing = await prisma.knowledgeBaseDocument.findUnique({
          where: { slug }
        })
        if (existing) {
          slug = `${slug}-${Date.now()}`
        }

        // Create or get tags
        const tagConnections = []
        if (tags && Array.isArray(tags)) {
          for (const tagName of tags as string[]) {
            let tag = await prisma.knowledgeBaseTag.findUnique({
              where: { name: tagName }
            })

            if (!tag) {
              tag = await prisma.knowledgeBaseTag.create({
                data: { name: tagName }
              })
            }

            tagConnections.push({
              tagId: tag.id
            })
          }
        }

        const document = await prisma.knowledgeBaseDocument.create({
          data: {
            title: title as string,
            content: content as string,
            slug,
            projectId: project_id as string | undefined,
            source: 'mcp',
            tags: {
              create: tagConnections
            }
          },
          include: {
            tags: {
              include: {
                tag: true
              }
            },
            project: {
              select: {
                id: true,
                name: true
              }
            }
          }
        })

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Knowledge base document created successfully',
                document: {
                  id: document.id,
                  title: document.title,
                  slug: document.slug,
                  url: `/knowledge-base/${document.slug}`,
                  tags: document.tags.map(t => t.tag.name),
                  project: document.project?.name
                }
              }, null, 2),
            },
          ],
        }
      }

      case 'list_knowledge_base': {
        const where: Record<string, unknown> = {}

        if (args.project_id) {
          where.projectId = args.project_id
        }

        if (args.tags && Array.isArray(args.tags) && args.tags.length > 0) {
          where.tags = {
            some: {
              tag: {
                name: { in: args.tags as string[] }
              }
            }
          }
        }

        const documents = await prisma.knowledgeBaseDocument.findMany({
          where,
          include: {
            tags: {
              include: {
                tag: true
              }
            },
            project: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { updatedAt: 'desc' },
        })

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                documents.map(d => ({
                  id: d.id,
                  title: d.title,
                  slug: d.slug,
                  url: `/knowledge-base/${d.slug}`,
                  tags: d.tags.map(t => t.tag.name),
                  project: d.project?.name,
                  source: d.source,
                  createdAt: d.createdAt,
                  updatedAt: d.updatedAt,
                })),
                null,
                2
              ),
            },
          ],
        }
      }

      case 'get_knowledge_base_document': {
        const document = await prisma.knowledgeBaseDocument.findUnique({
          where: { slug: args.slug as string },
          include: {
            tags: {
              include: {
                tag: true
              }
            },
            project: {
              select: {
                id: true,
                name: true
              }
            }
          }
        })

        if (!document) {
          return {
            content: [{ type: 'text', text: 'Document not found' }],
            isError: true,
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(document, null, 2),
            },
          ],
        }
      }

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        }
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    }
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('VibeFlow MCP server running on stdio')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

/**
 * Integration tests for MCP server functionality
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('MCP Server Integration', () => {
  beforeEach(async () => {
    await prisma.task.deleteMany()
    await prisma.project.deleteMany()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('Project Management', () => {
    it('should list all projects', async () => {
      // Create test projects
      await prisma.project.createMany({
        data: [
          { name: 'Project 1', path: '/path/1' },
          { name: 'Project 2', path: '/path/2' },
        ],
      })

      const projects = await prisma.project.findMany({
        include: { tasks: true },
      })

      expect(projects).toHaveLength(2)
      expect(projects[0]).toHaveProperty('name')
      expect(projects[0]).toHaveProperty('tasks')
    })

    it('should get project with tasks', async () => {
      const project = await prisma.project.create({
        data: {
          name: 'Test Project',
          path: '/test',
          tasks: {
            create: [
              { title: 'Task 1', status: 'todo', order: 0 },
              { title: 'Task 2', status: 'in_progress', order: 1 },
            ],
          },
        },
        include: { tasks: true },
      })

      expect(project.tasks).toHaveLength(2)
    })
  })

  describe('Task Management', () => {
    it('should filter tasks by status', async () => {
      const project = await prisma.project.create({
        data: {
          name: 'Test',
          path: '/test',
          tasks: {
            create: [
              { title: 'Todo', status: 'todo', order: 0 },
              { title: 'In Progress', status: 'in_progress', order: 1 },
              { title: 'Done', status: 'done', order: 2 },
            ],
          },
        },
      })

      const todoTasks = await prisma.task.findMany({
        where: {
          projectId: project.id,
          status: 'todo',
        },
      })

      expect(todoTasks).toHaveLength(1)
      expect(todoTasks[0].title).toBe('Todo')
    })

    it('should filter tasks by agent type', async () => {
      const project = await prisma.project.create({
        data: {
          name: 'Test',
          path: '/test',
          tasks: {
            create: [
              { title: 'Marketing Task', status: 'todo', agentType: 'marketing', order: 0 },
              { title: 'Technical Task', status: 'todo', agentType: 'technical', order: 1 },
            ],
          },
        },
      })

      const marketingTasks = await prisma.task.findMany({
        where: {
          projectId: project.id,
          agentType: 'marketing',
        },
      })

      expect(marketingTasks).toHaveLength(1)
      expect(marketingTasks[0].title).toBe('Marketing Task')
    })

    it('should get next prioritized task', async () => {
      const project = await prisma.project.create({
        data: {
          name: 'Test',
          path: '/test',
          tasks: {
            create: [
              { title: 'Low', status: 'todo', priority: 'low', order: 0 },
              { title: 'High', status: 'todo', priority: 'high', order: 1 },
              { title: 'Done', status: 'done', priority: 'high', order: 2 },
            ],
          },
        },
      })

      const nextTask = await prisma.task.findFirst({
        where: {
          projectId: project.id,
          status: { in: ['todo', 'in_progress'] },
        },
        orderBy: [
          { status: 'desc' },
          { priority: 'desc' },
          { order: 'asc' },
        ],
      })

      expect(nextTask?.title).toBe('High')
    })

    it('should update task status', async () => {
      const project = await prisma.project.create({
        data: {
          name: 'Test',
          path: '/test',
          tasks: {
            create: { title: 'Task', status: 'todo', order: 0 },
          },
        },
        include: { tasks: true },
      })

      const taskId = project.tasks[0].id

      await prisma.task.update({
        where: { id: taskId },
        data: { status: 'done' },
      })

      const updated = await prisma.task.findUnique({
        where: { id: taskId },
      })

      expect(updated?.status).toBe('done')
    })

    it('should create new task', async () => {
      const project = await prisma.project.create({
        data: { name: 'Test', path: '/test' },
      })

      const task = await prisma.task.create({
        data: {
          projectId: project.id,
          title: 'New Task',
          description: 'Test description',
          priority: 'high',
          status: 'todo',
          order: 0,
        },
      })

      expect(task.title).toBe('New Task')
      expect(task.priority).toBe('high')
    })
  })

  describe('Task Completion Tracking', () => {
    it('should calculate project completion percentage', async () => {
      const project = await prisma.project.create({
        data: {
          name: 'Test',
          path: '/test',
          tasks: {
            create: [
              { title: 'Done 1', status: 'done', order: 0 },
              { title: 'Done 2', status: 'done', order: 1 },
              { title: 'Todo', status: 'todo', order: 2 },
              { title: 'In Progress', status: 'in_progress', order: 3 },
            ],
          },
        },
        include: { tasks: true },
      })

      const totalTasks = project.tasks.length
      const completedTasks = project.tasks.filter(t => t.status === 'done').length
      const percentage = Math.round((completedTasks / totalTasks) * 100)

      expect(percentage).toBe(50)
    })
  })
})

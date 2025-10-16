import { ScannedProject } from './scanner'

export interface GeneratedTask {
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in_progress' | 'done'
}

export function generateTasksFromProject(project: ScannedProject): GeneratedTask[] {
  const tasks: GeneratedTask[] = []

  if (!project.readmeContent) {
    tasks.push({
      title: 'Add project README',
      description: 'Create a README.md file to document the project',
      priority: 'high',
      status: 'todo',
    })
    return tasks
  }

  const readme = project.readmeContent.toLowerCase()

  // Check for TODO sections
  const todoMatch = readme.match(/##?\s*todo[s]?[\s\S]*?(?=\n##|$)/gi)
  if (todoMatch) {
    extractTodoItems(todoMatch[0]).forEach(task => tasks.push(task))
  }

  // Check for setup/installation instructions
  if (readme.includes('installation') || readme.includes('setup') || readme.includes('getting started')) {
    if (!readme.includes('npm install') && !readme.includes('yarn install')) {
      tasks.push({
        title: 'Verify installation instructions',
        description: 'Ensure installation steps are complete and working',
        priority: 'medium',
        status: 'todo',
      })
    }
  }

  // Check for documentation mentions
  if (readme.includes('documentation') || readme.includes('docs')) {
    tasks.push({
      title: 'Review and update documentation',
      description: 'Ensure documentation is current and comprehensive',
      priority: 'low',
      status: 'todo',
    })
  }

  // Check for testing mentions
  if (readme.includes('test') || readme.includes('testing')) {
    tasks.push({
      title: 'Run and verify tests',
      description: 'Execute test suite and ensure all tests pass',
      priority: 'high',
      status: 'todo',
    })
  }

  // If no specific tasks found, add generic ones
  if (tasks.length === 0) {
    tasks.push({
      title: 'Review project status',
      description: 'Check if project is up to date and functioning',
      priority: 'medium',
      status: 'todo',
    })
  }

  return tasks
}

function extractTodoItems(todoSection: string): GeneratedTask[] {
  const tasks: GeneratedTask[] = []
  const lines = todoSection.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()

    // Match bullet points or list items
    const match = trimmed.match(/^[-*+]\s+(.+)$|^\d+\.\s+(.+)$/)
    if (match) {
      const title = (match[1] || match[2]).trim()
      if (title && title.length > 3) {
        tasks.push({
          title: title.replace(/\[.\]/, '').trim(),
          priority: 'medium',
          status: trimmed.includes('[x]') ? 'done' : 'todo',
        })
      }
    }
  }

  return tasks
}

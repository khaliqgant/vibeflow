import fs from 'fs/promises'
import path from 'path'

export interface ExtractedTask {
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  source: string // Which file it came from
  isCompleted: boolean
}

const PRIORITY_KEYWORDS = {
  high: ['urgent', 'critical', 'important', 'asap', 'priority', '!!!', 'bug', 'fix'],
  medium: ['should', 'improve', 'enhance', 'update', 'refactor'],
  low: ['nice to have', 'maybe', 'consider', 'optional', 'minor'],
}

// Patterns that indicate a task is too vague or low-value
const FLUFF_PATTERNS = [
  /^(add|update|improve|fix|enhance)\s*(more|some|the|a)?\s*$/i, // Too vague
  /^(tbd|tba|placeholder|example)$/i, // Placeholder content
  /^[\w\s]{1,5}$/i, // Too short (less than 5 chars)
  /^(test|testing)$/i, // Just "test" with no context
  /\?\?\?/,  // Uncertain/incomplete
  /^\s*$/,   // Empty or whitespace only
]

// Keywords that indicate valuable tasks
const VALUABLE_KEYWORDS = [
  'implement', 'create', 'build', 'develop', 'design', 'integrate',
  'migrate', 'deploy', 'setup', 'configure', 'optimize', 'refactor',
  'api', 'endpoint', 'database', 'authentication', 'security',
  'performance', 'bug', 'fix', 'issue', 'feature', 'functionality',
]

/**
 * Extract tasks from markdown content
 */
export function extractTasksFromMarkdown(
  content: string,
  filename: string
): ExtractedTask[] {
  const tasks: ExtractedTask[] = []

  // Extract checkbox tasks
  const uncheckedMatches = content.matchAll(/^[\s-]*\[[ ]\]\s+(.+)$/gm)
  for (const match of uncheckedMatches) {
    const taskText = match[1].trim()
    if (isValuableTask(taskText)) {
      tasks.push({
        title: taskText,
        priority: inferPriority(taskText),
        source: filename,
        isCompleted: false,
      })
    }
  }

  // Extract completed checkbox tasks (we'll mark them as done)
  const checkedMatches = content.matchAll(/^[\s-]*\[x\]\s+(.+)$/gim)
  for (const match of checkedMatches) {
    const taskText = match[1].trim()
    if (isValuableTask(taskText)) {
      tasks.push({
        title: taskText,
        priority: inferPriority(taskText),
        source: filename,
        isCompleted: true,
      })
    }
  }

  // Extract TODO/FIXME comments
  const commentMatches = content.matchAll(/(?:TODO|FIXME|NOTE|HACK):\s*(.+)$/gim)
  for (const match of commentMatches) {
    const taskText = match[1].trim()
    const keyword = match[0].split(':')[0].trim().toUpperCase()

    if (isValuableTask(taskText)) {
      tasks.push({
        title: taskText,
        description: `From ${keyword} in ${filename}`,
        priority: keyword === 'FIXME' ? 'high' : 'medium',
        source: filename,
        isCompleted: false,
      })
    }
  }

  return tasks
}

/**
 * Check if a task is worth including (not fluff)
 */
function isValuableTask(text: string): boolean {
  const trimmed = text.trim()

  // Check for fluff patterns
  for (const pattern of FLUFF_PATTERNS) {
    if (pattern.test(trimmed)) {
      return false
    }
  }

  // Must have at least 10 characters
  if (trimmed.length < 10) {
    return false
  }

  // Prefer tasks with valuable keywords or concrete details
  const lowerText = trimmed.toLowerCase()
  const hasValuableKeyword = VALUABLE_KEYWORDS.some(keyword => lowerText.includes(keyword))
  const hasConcreteDetail = /\b(file|function|component|module|class|method)\b/i.test(trimmed)
  const hasSpecificTechnology = /\b(react|node|python|typescript|docker|kubernetes|redis|postgres)\b/i.test(lowerText)

  // If it's a FIXME or has high priority keywords, include it
  const isHighPriority = PRIORITY_KEYWORDS.high.some(keyword => lowerText.includes(keyword))

  return hasValuableKeyword || hasConcreteDetail || hasSpecificTechnology || isHighPriority
}

/**
 * Infer priority from task text
 */
function inferPriority(text: string): 'low' | 'medium' | 'high' {
  const lowerText = text.toLowerCase()

  for (const keyword of PRIORITY_KEYWORDS.high) {
    if (lowerText.includes(keyword)) {
      return 'high'
    }
  }

  for (const keyword of PRIORITY_KEYWORDS.low) {
    if (lowerText.includes(keyword)) {
      return 'low'
    }
  }

  return 'medium'
}

/**
 * Find and read markdown files in a project
 */
export async function findMarkdownFiles(projectPath: string): Promise<string[]> {
  const markdownFiles: string[] = []

  const commonFiles = [
    'README.md',
    'TODO.md',
    'TASKS.md',
    'CONTRIBUTING.md',
    'ROADMAP.md',
    'CHANGELOG.md',
    '.github/ISSUE_TEMPLATE.md',
    'docs/TODO.md',
    'docs/ROADMAP.md',
  ]

  for (const file of commonFiles) {
    const filePath = path.join(projectPath, file)
    try {
      await fs.access(filePath)
      markdownFiles.push(filePath)
    } catch {
      // File doesn't exist, skip
    }
  }

  // Also look for any .md files in the root
  try {
    const entries = await fs.readdir(projectPath, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md') && !entry.name.startsWith('.')) {
        const fullPath = path.join(projectPath, entry.name)
        if (!markdownFiles.includes(fullPath)) {
          markdownFiles.push(fullPath)
        }
      }
    }
  } catch {
    // Could not read directory
  }

  return markdownFiles
}

/**
 * Extract all tasks from a project's markdown files
 */
export async function extractTasksFromProject(
  projectPath: string
): Promise<ExtractedTask[]> {
  const allTasks: ExtractedTask[] = []
  const markdownFiles = await findMarkdownFiles(projectPath)

  for (const filePath of markdownFiles) {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const filename = path.relative(projectPath, filePath)
      const tasks = extractTasksFromMarkdown(content, filename)
      allTasks.push(...tasks)
    } catch (error) {
      console.warn(`Could not read ${filePath}:`, error)
    }
  }

  return allTasks
}

import fs from 'fs/promises'
import path from 'path'

export interface ExtractedKBDocument {
  title: string
  content: string
  tags: string[]
  source: string // Which file it came from
  filename: string
}

const KB_FILE_PATTERNS = [
  'README.md',
  'CONTRIBUTING.md',
  'CHANGELOG.md',
  'ARCHITECTURE.md',
  'API.md',
  'SETUP.md',
  'DEPLOYMENT.md',
  'TROUBLESHOOTING.md',
  'FAQ.md',
  'GUIDE.md',
  'TUTORIAL.md',
]

const KB_DIRECTORIES = [
  'docs',
  'documentation',
  'wiki',
]

/**
 * Extract title from markdown content
 * Looks for first H1 header or uses filename
 */
export function extractTitle(content: string, filename: string): string {
  // Look for first H1 header
  const h1Match = content.match(/^#\s+(.+)$/m)
  if (h1Match) {
    return h1Match[1].trim()
  }

  // Fall back to filename without extension
  return filename.replace(/\.md$/i, '').replace(/[-_]/g, ' ')
}

/**
 * Extract tags from content and filename
 */
export function extractTags(content: string, filename: string, relativePath: string): string[] {
  const tags: Set<string> = new Set()

  // Add tag based on directory
  const dirName = path.dirname(relativePath)
  if (dirName !== '.' && dirName !== '/') {
    tags.add(dirName.split('/')[0])
  }

  // Add tag based on filename pattern
  const lowerFilename = filename.toLowerCase()
  if (lowerFilename.includes('readme')) tags.add('getting-started')
  if (lowerFilename.includes('api')) tags.add('api')
  if (lowerFilename.includes('guide')) tags.add('guide')
  if (lowerFilename.includes('tutorial')) tags.add('tutorial')
  if (lowerFilename.includes('setup')) tags.add('setup')
  if (lowerFilename.includes('deploy')) tags.add('deployment')
  if (lowerFilename.includes('troubleshoot')) tags.add('troubleshooting')
  if (lowerFilename.includes('faq')) tags.add('faq')
  if (lowerFilename.includes('contributing')) tags.add('contributing')
  if (lowerFilename.includes('changelog')) tags.add('changelog')
  if (lowerFilename.includes('architecture')) tags.add('architecture')

  // Extract code block languages as tags
  const codeBlockMatches = content.matchAll(/```(\w+)/g)
  for (const match of codeBlockMatches) {
    const lang = match[1].toLowerCase()
    if (['javascript', 'typescript', 'python', 'go', 'rust', 'java', 'ruby', 'php', 'c', 'cpp', 'csharp'].includes(lang)) {
      tags.add(lang)
    }
  }

  return Array.from(tags)
}

/**
 * Find markdown files suitable for knowledge base
 */
export async function findKBMarkdownFiles(projectPath: string): Promise<string[]> {
  const kbFiles: string[] = []

  // Check for common KB files in root
  for (const pattern of KB_FILE_PATTERNS) {
    const filePath = path.join(projectPath, pattern)
    try {
      await fs.access(filePath)
      kbFiles.push(filePath)
    } catch {
      // File doesn't exist, skip
    }
  }

  // Check KB directories
  for (const dir of KB_DIRECTORIES) {
    const dirPath = path.join(projectPath, dir)
    try {
      await fs.access(dirPath)
      const files = await findMarkdownFilesRecursive(dirPath, 3) // Max 3 levels deep
      kbFiles.push(...files)
    } catch {
      // Directory doesn't exist, skip
    }
  }

  return kbFiles
}

/**
 * Recursively find markdown files
 */
async function findMarkdownFilesRecursive(
  dirPath: string,
  maxDepth: number,
  currentDepth = 0
): Promise<string[]> {
  if (currentDepth >= maxDepth) return []

  const files: string[] = []

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue

      const fullPath = path.join(dirPath, entry.name)

      if (entry.isDirectory()) {
        const subFiles = await findMarkdownFilesRecursive(fullPath, maxDepth, currentDepth + 1)
        files.push(...subFiles)
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath)
      }
    }
  } catch (error) {
    // Could not read directory
  }

  return files
}

/**
 * Extract knowledge base documents from a project
 */
export async function extractKBDocumentsFromProject(
  projectPath: string
): Promise<ExtractedKBDocument[]> {
  const documents: ExtractedKBDocument[] = []
  const markdownFiles = await findKBMarkdownFiles(projectPath)

  for (const filePath of markdownFiles) {
    try {
      const content = await fs.readFile(filePath, 'utf-8')

      // Skip empty files or files with very little content
      if (content.trim().length < 50) continue

      const relativePath = path.relative(projectPath, filePath)
      const filename = path.basename(filePath)

      const title = extractTitle(content, filename)
      const tags = extractTags(content, filename, relativePath)

      documents.push({
        title,
        content,
        tags,
        source: relativePath,
        filename,
      })
    } catch (error) {
      console.warn(`Could not read ${filePath}:`, error)
    }
  }

  return documents
}

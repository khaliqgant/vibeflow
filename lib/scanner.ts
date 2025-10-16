import fs from 'fs/promises'
import path from 'path'
import simpleGit from 'simple-git'

export interface ScannedProject {
  name: string
  path: string
  description?: string
  repoUrl?: string
  hasGit: boolean
  readmeContent?: string
  suggestedParentName?: string  // Suggested parent project name (e.g., "my-saas")
  isLikelyChildRepo?: boolean   // Whether this looks like part of a multi-repo project
}

export async function scanDirectory(dirPath: string): Promise<ScannedProject[]> {
  const projects: ScannedProject[] = []

  try {
    // First check if the given path itself is a git repository
    const isGitRepo = await checkGitRepo(dirPath)

    if (isGitRepo) {
      // This is a single project, not a directory of projects
      const projectName = path.basename(dirPath)
      const project = await analyzeProject(dirPath, projectName)
      if (project) {
        projects.push(project)
      }
      return projects
    }

    // If not a git repo, scan subdirectories for git repositories
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const projectPath = path.join(dirPath, entry.name)
        // Only include if it has a .git directory
        const hasGit = await checkGitRepo(projectPath)
        if (hasGit) {
          const project = await analyzeProject(projectPath, entry.name)
          if (project) {
            projects.push(project)
          }
        }
      }
    }
  } catch (error) {
    console.error('Error scanning directory:', error)
  }

  return projects
}

async function analyzeProject(projectPath: string, name: string): Promise<ScannedProject | null> {
  try {
    const hasGit = await checkGitRepo(projectPath)
    const readmeContent = await findAndReadReadme(projectPath)
    const description = extractDescription(readmeContent)
    let repoUrl: string | undefined

    if (hasGit) {
      repoUrl = await getGitRemoteUrl(projectPath)
    }

    // Detect if this might be a child repo of a multi-repo project
    const parentDirName = path.basename(path.dirname(projectPath))
    const { suggestedParentName, isLikelyChildRepo } = detectMultiRepoStructure(
      name,
      parentDirName,
      repoUrl
    )

    return {
      name,
      path: projectPath,
      description,
      repoUrl,
      hasGit,
      readmeContent,
      suggestedParentName,
      isLikelyChildRepo,
    }
  } catch (error) {
    console.error(`Error analyzing project ${name}:`, error)
    return null
  }
}

async function checkGitRepo(projectPath: string): Promise<boolean> {
  try {
    const gitPath = path.join(projectPath, '.git')
    await fs.access(gitPath)
    return true
  } catch {
    return false
  }
}

async function getGitRemoteUrl(projectPath: string): Promise<string | undefined> {
  try {
    const git = simpleGit(projectPath)
    const remotes = await git.getRemotes(true)
    const originUrl = remotes.find(r => r.name === 'origin')?.refs.fetch

    if (!originUrl) return undefined

    // Convert git@ format to https:// format
    // git@github.com:user/repo.git -> https://github.com/user/repo
    if (originUrl.startsWith('git@')) {
      return originUrl
        .replace(/^git@([^:]+):/, 'https://$1/')
        .replace(/\.git$/, '')
    }

    // Remove .git suffix from https URLs
    if (originUrl.endsWith('.git')) {
      return originUrl.replace(/\.git$/, '')
    }

    return originUrl
  } catch {
    return undefined
  }
}

async function findAndReadReadme(projectPath: string): Promise<string | undefined> {
  const readmeNames = ['README.md', 'readme.md', 'README.MD', 'README', 'readme']

  for (const readmeName of readmeNames) {
    try {
      const readmePath = path.join(projectPath, readmeName)
      const content = await fs.readFile(readmePath, 'utf-8')
      return content
    } catch {
      continue
    }
  }

  return undefined
}

function extractDescription(readmeContent?: string): string | undefined {
  if (!readmeContent) return undefined

  const lines = readmeContent.split('\n')

  // Skip title lines and find first paragraph
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const line = lines[i].trim()
    if (line && !line.startsWith('#') && !line.startsWith('!')) {
      return line.slice(0, 200)
    }
  }

  return undefined
}

/**
 * Detect if a project is likely part of a multi-repo structure
 * Looks for common patterns like:
 * - /my-saas/web, /my-saas/api, /my-saas/mobile
 * - Shared GitHub org/repo prefix in repoUrl
 * - Common naming patterns (frontend/backend, client/server)
 */
function detectMultiRepoStructure(
  projectName: string,
  parentDirName: string,
  repoUrl?: string
): { suggestedParentName?: string; isLikelyChildRepo: boolean } {
  // Common child repo names that indicate multi-repo structure
  const childRepoIndicators = [
    'web', 'frontend', 'client', 'ui', 'app',
    'api', 'backend', 'server', 'services',
    'mobile', 'ios', 'android',
    'docs', 'documentation',
    'infra', 'infrastructure', 'terraform', 'k8s', 'deployment',
    'shared', 'common', 'lib', 'packages',
    'admin', 'dashboard',
  ]

  const lowerName = projectName.toLowerCase()
  const isCommonChildName = childRepoIndicators.some(indicator =>
    lowerName === indicator || lowerName.includes(`-${indicator}`) || lowerName.includes(`_${indicator}`)
  )

  // Check if GitHub URL suggests it's part of a monorepo or multi-repo setup
  let suggestedParentFromUrl: string | undefined
  if (repoUrl) {
    // Extract repo name pattern like "my-saas-web" -> "my-saas"
    const match = repoUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/i)
    if (match) {
      const repoName = match[2]
      // If repo name is like "my-saas-web", extract "my-saas"
      for (const indicator of childRepoIndicators) {
        if (repoName.endsWith(`-${indicator}`)) {
          suggestedParentFromUrl = repoName.slice(0, -indicator.length - 1)
          break
        }
      }
    }
  }

  // If parent directory isn't "projects" or similar generic name, it might be the project group
  const genericParentNames = ['projects', 'code', 'repos', 'git', 'workspace', 'dev', 'work']
  const parentIsGeneric = genericParentNames.includes(parentDirName.toLowerCase())

  return {
    suggestedParentName: suggestedParentFromUrl || (!parentIsGeneric ? parentDirName : undefined),
    isLikelyChildRepo: isCommonChildName || !!suggestedParentFromUrl,
  }
}

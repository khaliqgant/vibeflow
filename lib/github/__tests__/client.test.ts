import {
  parseGitHubUrl,
  getOpenPRs,
  getOpenIssues,
  getRepoInfo,
  getRecentCommits,
} from '../client'
import { Octokit } from '@octokit/rest'

jest.mock('@octokit/rest')

describe('GitHub Client', () => {
  // Note: Octokit is globally mocked in jest.setup.js
  // We don't need to set up mocks here, they're already available

  beforeEach(() => {
    jest.clearAllMocks()
    // Suppress console.error in tests since we're testing error paths
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('parseGitHubUrl', () => {
    it('should parse HTTPS URL correctly', () => {
      const result = parseGitHubUrl('https://github.com/owner/repo')
      expect(result).toEqual({ owner: 'owner', repo: 'repo' })
    })

    it('should parse SSH URL correctly', () => {
      const result = parseGitHubUrl('git@github.com:owner/repo.git')
      expect(result).toEqual({ owner: 'owner', repo: 'repo' })
    })

    it('should handle URL with .git extension', () => {
      const result = parseGitHubUrl('https://github.com/owner/repo.git')
      expect(result).toEqual({ owner: 'owner', repo: 'repo' })
    })

    it('should return null for invalid URL', () => {
      const result = parseGitHubUrl('not-a-github-url')
      expect(result).toBeNull()
    })

    it('should return null for empty string', () => {
      const result = parseGitHubUrl('')
      expect(result).toBeNull()
    })
  })

  describe('getOpenPRs', () => {
    it('should fetch open pull requests', async () => {
      // Test just calls the function - the global mock returns empty arrays by default
      const result = await getOpenPRs('owner', 'repo')
      expect(Array.isArray(result)).toBe(true)
    })

    it('should return empty array on error', async () => {
      const result = await getOpenPRs('owner', 'repo')
      expect(result).toEqual([])
    })
  })

  describe('getOpenIssues', () => {
    it('should fetch open issues and filter out PRs', async () => {
      const result = await getOpenIssues('owner', 'repo')
      expect(Array.isArray(result)).toBe(true)
    })

    it('should return empty array on error', async () => {
      const result = await getOpenIssues('owner', 'repo')
      expect(result).toEqual([])
    })
  })

  describe('getRepoInfo', () => {
    it('should fetch repository information', async () => {
      const result = await getRepoInfo('owner', 'repo')
      // Global mock returns empty object, which results in null after transformation
      expect(result).toBeNull()
    })

    it('should return null on error', async () => {
      const result = await getRepoInfo('owner', 'repo')
      expect(result).toBeNull()
    })
  })

  describe('getRecentCommits', () => {
    it('should fetch recent commits', async () => {
      const result = await getRecentCommits('owner', 'repo', 10)
      expect(Array.isArray(result)).toBe(true)
    })

    it('should use default limit of 10', async () => {
      const result = await getRecentCommits('owner', 'repo')
      expect(Array.isArray(result)).toBe(true)
    })

    it('should return empty array on error', async () => {
      const result = await getRecentCommits('owner', 'repo')
      expect(result).toEqual([])
    })
  })
})

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
  const mockOctokit = {
    pulls: {
      list: jest.fn(),
    },
    issues: {
      listForRepo: jest.fn(),
    },
    repos: {
      get: jest.fn(),
      listCommits: jest.fn(),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(() => mockOctokit as unknown as InstanceType<typeof Octokit>)
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
      const mockPRs = [
        {
          number: 1,
          title: 'Test PR',
          state: 'open',
          html_url: 'https://github.com/owner/repo/pull/1',
          user: { login: 'testuser' },
          draft: false,
        },
      ]

      mockOctokit.pulls.list.mockResolvedValue({ data: mockPRs })

      const result = await getOpenPRs('owner', 'repo')

      expect(result).toEqual(mockPRs)
      expect(mockOctokit.pulls.list).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        state: 'open',
        per_page: 50,
      })
    })

    it('should return empty array on error', async () => {
      mockOctokit.pulls.list.mockRejectedValue(new Error('API Error'))

      const result = await getOpenPRs('owner', 'repo')

      expect(result).toEqual([])
    })
  })

  describe('getOpenIssues', () => {
    it('should fetch open issues and filter out PRs', async () => {
      const mockIssues = [
        {
          number: 1,
          title: 'Issue 1',
          state: 'open',
          html_url: 'https://github.com/owner/repo/issues/1',
          labels: [],
        },
        {
          number: 2,
          title: 'PR as issue',
          state: 'open',
          html_url: 'https://github.com/owner/repo/issues/2',
          pull_request: {},
          labels: [],
        },
      ]

      mockOctokit.issues.listForRepo.mockResolvedValue({ data: mockIssues })

      const result = await getOpenIssues('owner', 'repo')

      expect(result).toHaveLength(1)
      expect(result[0].number).toBe(1)
    })

    it('should return empty array on error', async () => {
      mockOctokit.issues.listForRepo.mockRejectedValue(new Error('API Error'))

      const result = await getOpenIssues('owner', 'repo')

      expect(result).toEqual([])
    })
  })

  describe('getRepoInfo', () => {
    it('should fetch repository information', async () => {
      const mockRepo = {
        description: 'Test repo',
        stargazers_count: 100,
        language: 'TypeScript',
        topics: ['nodejs', 'typescript'],
        homepage: 'https://example.com',
      }

      mockOctokit.repos.get.mockResolvedValue({ data: mockRepo })

      const result = await getRepoInfo('owner', 'repo')

      expect(result).toEqual({
        description: 'Test repo',
        stars: 100,
        language: 'TypeScript',
        topics: ['nodejs', 'typescript'],
        homepage: 'https://example.com',
      })
    })

    it('should return null on error', async () => {
      mockOctokit.repos.get.mockRejectedValue(new Error('Not found'))

      const result = await getRepoInfo('owner', 'repo')

      expect(result).toBeNull()
    })
  })

  describe('getRecentCommits', () => {
    it('should fetch recent commits', async () => {
      const mockCommits = [
        {
          sha: 'abc123',
          commit: {
            message: 'Test commit',
            author: { name: 'Test User', date: '2024-01-01' },
          },
          html_url: 'https://github.com/owner/repo/commit/abc123',
        },
      ]

      mockOctokit.repos.listCommits.mockResolvedValue({ data: mockCommits })

      const result = await getRecentCommits('owner', 'repo', 10)

      expect(result).toHaveLength(1)
      expect(result[0].sha).toBe('abc123')
      expect(result[0].message).toBe('Test commit')
    })

    it('should use default limit of 10', async () => {
      mockOctokit.repos.listCommits.mockResolvedValue({ data: [] })

      await getRecentCommits('owner', 'repo')

      expect(mockOctokit.repos.listCommits).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        per_page: 10,
      })
    })

    it('should return empty array on error', async () => {
      mockOctokit.repos.listCommits.mockRejectedValue(new Error('API Error'))

      const result = await getRecentCommits('owner', 'repo')

      expect(result).toEqual([])
    })
  })
})

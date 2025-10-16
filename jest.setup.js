import '@testing-library/jest-dom'

// Polyfill setImmediate for Prisma
global.setImmediate = global.setImmediate || ((fn, ...args) => global.setTimeout(fn, 0, ...args))

// Mock environment variables
process.env.ANTHROPIC_API_KEY = 'test-key'
process.env.OPENAI_API_KEY = 'test-key'
process.env.GITHUB_TOKEN = 'test-token'
process.env.DATABASE_URL = 'file:./test.db'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock @octokit/rest completely to avoid ES module issues
jest.mock('@octokit/rest', () => {
  const mockOctokit = jest.fn().mockImplementation(() => ({
    rest: {
      pulls: {
        list: jest.fn().mockResolvedValue({ data: [] }),
      },
      issues: {
        listForRepo: jest.fn().mockResolvedValue({ data: [] }),
      },
      repos: {
        get: jest.fn().mockResolvedValue({ data: {} }),
        listCommits: jest.fn().mockResolvedValue({ data: [] }),
      },
    },
  }))

  return { Octokit: mockOctokit }
})

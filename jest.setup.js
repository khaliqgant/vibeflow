import '@testing-library/jest-dom'

// Mock environment variables
process.env.ANTHROPIC_API_KEY = 'test-key'
process.env.OPENAI_API_KEY = 'test-key'
process.env.GITHUB_TOKEN = 'test-token'
process.env.DATABASE_URL = 'file:./test.db'

# Testing Guide

VibeFlow includes a comprehensive test suite covering unit tests, component tests, and integration tests.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

## Test Structure

```
vibeflow/
├── __tests__/
│   └── integration/          # Integration tests
│       ├── project-analysis.test.ts
│       └── mcp-server.test.ts
├── lib/
│   ├── ai/
│   │   └── __tests__/        # AI provider tests
│   │       └── provider.test.ts
│   ├── agents/
│   │   └── __tests__/        # Agent system tests
│   │       ├── definitions.test.ts
│   │       └── task-generator.test.ts
│   ├── github/
│   │   └── __tests__/        # GitHub client tests
│   │       └── client.test.ts
│   └── __tests__/            # Scanner tests
│       └── scanner.test.ts
└── components/
    └── __tests__/            # React component tests
        ├── TaskCard.test.tsx
        └── AgentBadge.test.tsx
```

## Test Coverage

Current coverage targets:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

View detailed coverage report:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Writing Tests

### Unit Tests

Test individual functions and modules:

```typescript
import { getDefaultProvider } from '../provider'

describe('AI Provider', () => {
  it('should return claude as default', () => {
    expect(getDefaultProvider()).toBe('claude')
  })
})
```

### Component Tests

Test React components with React Testing Library:

```typescript
import { render, screen } from '@testing-library/react'
import { TaskCard } from '../TaskCard'

describe('TaskCard', () => {
  it('should render task title', () => {
    render(<TaskCard task={mockTask} onUpdate={jest.fn()} />)
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })
})
```

### Integration Tests

Test full workflows:

```typescript
describe('Project Analysis Integration', () => {
  it('should complete full analysis workflow', async () => {
    const project = await prisma.project.create({ ... })
    const result = await orchestrateProjectAnalysis(project.id)
    expect(result.totalTasks).toBeGreaterThan(0)
  })
})
```

## Mocking

### External APIs

```typescript
jest.mock('@anthropic-ai/sdk')
jest.mock('openai')
jest.mock('@octokit/rest')
```

### File System

```typescript
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  readdir: jest.fn(),
}))
```

### Prisma

Prisma is not mocked - integration tests use a real test database.

## CI/CD

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

GitHub Actions workflow: `.github/workflows/test.yml`

## Test Coverage Areas

### ✅ Covered

1. **AI Provider System**
   - Provider selection (Claude/OpenAI)
   - Model selection
   - API calls
   - Error handling

2. **Agent System**
   - Agent definitions
   - Task generation
   - Prompt building
   - Response parsing

3. **GitHub Integration**
   - URL parsing
   - PR fetching
   - Issue fetching
   - Repository info

4. **Scanner**
   - Directory scanning
   - Git repository detection
   - README parsing
   - Description extraction

5. **UI Components**
   - Task cards
   - Agent badges
   - Rendering logic

6. **Integration Workflows**
   - Full project analysis
   - MCP server operations
   - Database interactions

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `beforeEach` and `afterAll` for setup/teardown
3. **Descriptive Names**: Test names should describe expected behavior
4. **Single Responsibility**: One assertion per test when possible
5. **Mock External Deps**: Mock APIs, file system, etc.

## Debugging Tests

```bash
# Run specific test file
npm test -- provider.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should return"

# Run with verbose output
npm test -- --verbose

# Debug in VS Code
# Add breakpoint and use "Jest: Debug" configuration
```

## Future Test Additions

- [ ] E2E tests with Playwright
- [ ] API route tests
- [ ] Performance tests
- [ ] Visual regression tests
- [ ] Accessibility tests

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

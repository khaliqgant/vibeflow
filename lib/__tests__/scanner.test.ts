import { scanDirectory } from '../scanner'
import fs from 'fs/promises'
import simpleGit from 'simple-git'

jest.mock('fs/promises')
jest.mock('simple-git')

describe('Scanner', () => {
  const mockFs = fs as jest.Mocked<typeof fs>
  const mockGit = simpleGit as jest.MockedFunction<typeof simpleGit>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('scanDirectory', () => {
    it('should scan directory and return projects', async () => {
      mockFs.readdir.mockResolvedValue([
        { name: 'project1', isDirectory: () => true } as any,
        { name: 'project2', isDirectory: () => true } as any,
        { name: 'file.txt', isDirectory: () => false } as any,
      ])

      mockFs.access.mockResolvedValue(undefined)
      mockFs.readFile.mockResolvedValue('# Test Project\nDescription here')

      const mockGitInstance = {
        getRemotes: jest.fn().mockResolvedValue([
          { name: 'origin', refs: { fetch: 'https://github.com/test/repo' } },
        ]),
      }
      mockGit.mockReturnValue(mockGitInstance as any)

      const result = await scanDirectory('/test/path')

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('project1')
      expect(result[0].hasGit).toBe(true)
      expect(result[1].name).toBe('project2')
    })

    it('should skip hidden directories', async () => {
      mockFs.readdir.mockResolvedValue([
        { name: '.hidden', isDirectory: () => true } as any,
        { name: 'visible', isDirectory: () => true } as any,
      ])

      mockFs.access.mockResolvedValue(undefined)
      mockFs.readFile.mockResolvedValue('# Test')

      const mockGitInstance = {
        getRemotes: jest.fn().mockResolvedValue([]),
      }
      mockGit.mockReturnValue(mockGitInstance as any)

      const result = await scanDirectory('/test/path')

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('visible')
    })

    it('should handle directories without git', async () => {
      mockFs.readdir.mockResolvedValue([
        { name: 'no-git', isDirectory: () => true } as any,
      ])

      mockFs.access.mockRejectedValue(new Error('Not found'))
      mockFs.readFile.mockResolvedValue('# Test')

      const result = await scanDirectory('/test/path')

      expect(result).toHaveLength(1)
      expect(result[0].hasGit).toBe(false)
      expect(result[0].repoUrl).toBeUndefined()
    })

    it('should extract description from README', async () => {
      mockFs.readdir.mockResolvedValue([
        { name: 'project', isDirectory: () => true } as any,
      ])

      mockFs.access.mockResolvedValue(undefined)
      mockFs.readFile.mockResolvedValue('# Title\n\nThis is the description')

      const mockGitInstance = {
        getRemotes: jest.fn().mockResolvedValue([]),
      }
      mockGit.mockReturnValue(mockGitInstance as any)

      const result = await scanDirectory('/test/path')

      expect(result[0].description).toBe('This is the description')
    })

    it('should handle missing README', async () => {
      mockFs.readdir.mockResolvedValue([
        { name: 'project', isDirectory: () => true } as any,
      ])

      mockFs.access.mockResolvedValue(undefined)
      mockFs.readFile.mockRejectedValue(new Error('Not found'))

      const mockGitInstance = {
        getRemotes: jest.fn().mockResolvedValue([]),
      }
      mockGit.mockReturnValue(mockGitInstance as any)

      const result = await scanDirectory('/test/path')

      expect(result[0].readmeContent).toBeUndefined()
      expect(result[0].description).toBeUndefined()
    })

    it('should handle scan errors gracefully', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Permission denied'))

      const result = await scanDirectory('/test/path')

      expect(result).toEqual([])
    })
  })
})

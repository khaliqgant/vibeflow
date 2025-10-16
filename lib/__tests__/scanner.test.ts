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
      // First access call checks if path itself is a git repo (should fail)
      // Subsequent calls check subdirectories
      mockFs.access
        .mockRejectedValueOnce(new Error('Not found'))
        .mockResolvedValue(undefined)

      mockFs.readdir.mockResolvedValue([
        { name: 'project1', isDirectory: () => true } as fs.Dirent,
        { name: 'project2', isDirectory: () => true } as fs.Dirent,
        { name: 'file.txt', isDirectory: () => false } as fs.Dirent,
      ])

      mockFs.readFile.mockResolvedValue('# Test Project\nDescription here')

      const mockGitInstance = {
        getRemotes: jest.fn().mockResolvedValue([
          { name: 'origin', refs: { fetch: 'https://github.com/test/repo' } },
        ]),
      }
      mockGit.mockReturnValue(mockGitInstance as ReturnType<typeof simpleGit>)

      const result = await scanDirectory('/test/path')

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('project1')
      expect(result[0].hasGit).toBe(true)
      expect(result[1].name).toBe('project2')
    })

    it('should skip hidden directories', async () => {
      // First access call checks if path itself is a git repo (should fail)
      mockFs.access
        .mockRejectedValueOnce(new Error('Not found'))
        .mockResolvedValue(undefined)

      mockFs.readdir.mockResolvedValue([
        { name: '.hidden', isDirectory: () => true } as fs.Dirent,
        { name: 'visible', isDirectory: () => true } as fs.Dirent,
      ])

      mockFs.readFile.mockResolvedValue('# Test')

      const mockGitInstance = {
        getRemotes: jest.fn().mockResolvedValue([]),
      }
      mockGit.mockReturnValue(mockGitInstance as ReturnType<typeof simpleGit>)

      const result = await scanDirectory('/test/path')

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('visible')
    })

    it('should handle directories without git', async () => {
      // All git checks fail (path itself and subdirectories)
      mockFs.access.mockRejectedValue(new Error('Not found'))

      mockFs.readdir.mockResolvedValue([
        { name: 'no-git', isDirectory: () => true } as fs.Dirent,
      ])

      mockFs.readFile.mockResolvedValue('# Test')

      const result = await scanDirectory('/test/path')

      expect(result).toHaveLength(0)
    })

    it('should extract description from README', async () => {
      // First check fails (not itself a git repo), then subdirectory check passes
      mockFs.access
        .mockRejectedValueOnce(new Error('Not found'))
        .mockResolvedValue(undefined)

      mockFs.readdir.mockResolvedValue([
        { name: 'project', isDirectory: () => true } as fs.Dirent,
      ])

      mockFs.readFile.mockResolvedValue('# Title\n\nThis is the description')

      const mockGitInstance = {
        getRemotes: jest.fn().mockResolvedValue([]),
      }
      mockGit.mockReturnValue(mockGitInstance as ReturnType<typeof simpleGit>)

      const result = await scanDirectory('/test/path')

      expect(result[0].description).toBe('This is the description')
    })

    it('should handle missing README', async () => {
      // First check fails (not itself a git repo), then subdirectory check passes
      mockFs.access
        .mockRejectedValueOnce(new Error('Not found'))
        .mockResolvedValue(undefined)

      mockFs.readdir.mockResolvedValue([
        { name: 'project', isDirectory: () => true } as fs.Dirent,
      ])

      mockFs.readFile.mockRejectedValue(new Error('Not found'))

      const mockGitInstance = {
        getRemotes: jest.fn().mockResolvedValue([]),
      }
      mockGit.mockReturnValue(mockGitInstance as ReturnType<typeof simpleGit>)

      const result = await scanDirectory('/test/path')

      expect(result[0].readmeContent).toBeUndefined()
      expect(result[0].description).toBeUndefined()
    })

    it('should handle scan errors gracefully', async () => {
      // First check if path itself is a git repo - let's say it is
      mockFs.access.mockResolvedValue(undefined)
      // But readFile fails
      mockFs.readFile.mockRejectedValue(new Error('Permission denied'))

      const mockGitInstance = {
        getRemotes: jest.fn().mockResolvedValue([]),
      }
      mockGit.mockReturnValue(mockGitInstance as ReturnType<typeof simpleGit>)

      const result = await scanDirectory('/test/path')

      // Should still return the project even if README is missing
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('path')
    })
  })
})

import { prisma } from '../prisma'

/**
 * Calculate similarity between two strings (0-1 scale)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()

  // Exact match
  if (s1 === s2) return 1.0

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.8

  // Check word overlap
  const words1 = s1.split(/\s+/)
  const words2 = s2.split(/\s+/)
  const commonWords = words1.filter(w => words2.includes(w) && w.length > 3)
  const similarity = (2 * commonWords.length) / (words1.length + words2.length)

  return similarity
}

/**
 * Check if a task with similar title already exists
 */
export async function isDuplicateTask(
  projectId: string,
  taskTitle: string,
  threshold: number = 0.7
): Promise<boolean> {
  const existingTasks = await prisma.task.findMany({
    where: { projectId },
    select: { title: true },
  })

  for (const existingTask of existingTasks) {
    const similarity = calculateSimilarity(taskTitle, existingTask.title)
    if (similarity >= threshold) {
      return true
    }
  }

  return false
}

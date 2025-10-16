-- AlterTable
ALTER TABLE "Project" ADD COLUMN "aiAnalysis" TEXT;
ALTER TABLE "Project" ADD COLUMN "githubOwner" TEXT;
ALTER TABLE "Project" ADD COLUMN "githubRepo" TEXT;
ALTER TABLE "Project" ADD COLUMN "lastAnalyzedAt" DATETIME;
ALTER TABLE "Project" ADD COLUMN "techStack" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "agentType" TEXT;
ALTER TABLE "Task" ADD COLUMN "aiReasoning" TEXT;
ALTER TABLE "Task" ADD COLUMN "githubIssueUrl" TEXT;
ALTER TABLE "Task" ADD COLUMN "githubPrUrl" TEXT;

-- CreateTable
CREATE TABLE "ProjectInsight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "agentType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectInsight_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

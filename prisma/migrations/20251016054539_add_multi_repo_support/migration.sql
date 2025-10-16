-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "path" TEXT NOT NULL,
    "repoUrl" TEXT,
    "githubOwner" TEXT,
    "githubRepo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "color" TEXT,
    "aiAnalysis" TEXT,
    "techStack" TEXT,
    "lastAnalyzedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "parentProjectId" TEXT,
    "projectGroupId" TEXT,
    "tags" TEXT,
    CONSTRAINT "Project_parentProjectId_fkey" FOREIGN KEY ("parentProjectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("aiAnalysis", "color", "createdAt", "description", "githubOwner", "githubRepo", "id", "lastAnalyzedAt", "name", "path", "repoUrl", "status", "tags", "techStack", "updatedAt") SELECT "aiAnalysis", "color", "createdAt", "description", "githubOwner", "githubRepo", "id", "lastAnalyzedAt", "name", "path", "repoUrl", "status", "tags", "techStack", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_path_key" ON "Project"("path");
CREATE INDEX "Project_parentProjectId_idx" ON "Project"("parentProjectId");
CREATE INDEX "Project_projectGroupId_idx" ON "Project"("projectGroupId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

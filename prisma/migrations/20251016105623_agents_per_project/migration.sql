-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '🤖',
    "description" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "taskCategories" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "projectId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Agent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Agent" ("createdAt", "description", "icon", "id", "isActive", "isDefault", "name", "systemPrompt", "taskCategories", "type", "updatedAt") SELECT "createdAt", "description", "icon", "id", "isActive", "isDefault", "name", "systemPrompt", "taskCategories", "type", "updatedAt" FROM "Agent";
DROP TABLE "Agent";
ALTER TABLE "new_Agent" RENAME TO "Agent";
CREATE INDEX "Agent_isActive_idx" ON "Agent"("isActive");
CREATE INDEX "Agent_isDefault_idx" ON "Agent"("isDefault");
CREATE INDEX "Agent_projectId_idx" ON "Agent"("projectId");
CREATE UNIQUE INDEX "Agent_projectId_type_key" ON "Agent"("projectId", "type");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

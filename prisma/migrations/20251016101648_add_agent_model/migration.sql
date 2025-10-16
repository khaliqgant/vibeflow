-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '🤖',
    "description" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "taskCategories" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_type_key" ON "Agent"("type");

-- CreateIndex
CREATE INDEX "Agent_isActive_idx" ON "Agent"("isActive");

-- CreateIndex
CREATE INDEX "Agent_isDefault_idx" ON "Agent"("isDefault");

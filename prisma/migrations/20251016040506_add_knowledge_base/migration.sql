-- CreateTable
CREATE TABLE "KnowledgeBaseDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "projectId" TEXT,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KnowledgeBaseDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KnowledgeBaseTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "KnowledgeBaseDocumentTag" (
    "documentId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("documentId", "tagId"),
    CONSTRAINT "KnowledgeBaseDocumentTag_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "KnowledgeBaseDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KnowledgeBaseDocumentTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "KnowledgeBaseTag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeBaseDocument_slug_key" ON "KnowledgeBaseDocument"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeBaseTag_name_key" ON "KnowledgeBaseTag"("name");

-- CreateIndex
CREATE INDEX "KnowledgeBaseDocumentTag_documentId_idx" ON "KnowledgeBaseDocumentTag"("documentId");

-- CreateIndex
CREATE INDEX "KnowledgeBaseDocumentTag_tagId_idx" ON "KnowledgeBaseDocumentTag"("tagId");

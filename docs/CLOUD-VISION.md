# ☁️ VibeFlow Cloud - Architecture & Vision

**Status**: Planning / Early Spec
**Target**: Q2 2025
**Goal**: Seamless transition from local to cloud with zero-config sync

---

## Core Principle

> A user should be able to click "Sync to Cloud" and have their entire VibeFlow setup—projects, tasks, insights, knowledge base—available everywhere, with zero manual configuration.

---

## User Journey

### Current State (Local)
```
Developer has:
- 10 projects scanned locally
- 150 AI-generated tasks
- 25 knowledge base documents
- Multi-repo structures linked
- Personal API keys (Claude/OpenAI)
- 3 months of history
```

### Desired State (Cloud)
```
Same developer:
1. Clicks "☁️ Sync to Cloud" in settings
2. Creates account (email + password OR GitHub OAuth)
3. All data uploads automatically
4. Receives shareable team invite link
5. Team members see same projects/tasks
6. Real-time collaboration begins
7. Local app stays in sync
```

**Zero friction. Zero data loss. Zero reconfiguration.**

---

## Architecture Overview

### High-Level Stack

```
┌─────────────────────────────────────────┐
│           VibeFlow Desktop              │
│         (Electron or Tauri)             │
│                                         │
│  • Local SQLite (offline-first)        │
│  • Background sync worker              │
│  • WebSocket client                    │
│  • Local MCP server                    │
└──────────────┬──────────────────────────┘
               │ HTTPS + WebSocket
               │
┌──────────────▼──────────────────────────┐
│         VibeFlow Cloud API              │
│        (Next.js + tRPC/GraphQL)         │
│                                         │
│  • Authentication (NextAuth)           │
│  • Real-time sync (WebSockets)         │
│  • API key management                  │
│  • Team management                     │
│  • Billing (Stripe)                    │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Cloud Database                  │
│         (PostgreSQL + Redis)            │
│                                         │
│  • Multi-tenant architecture           │
│  • Row-level security                  │
│  • Encryption at rest                  │
└─────────────────────────────────────────┘
```

### Technology Choices

| Component | Local (Current) | Cloud (Proposed) |
|-----------|----------------|------------------|
| **Database** | SQLite | PostgreSQL (Supabase or Neon) |
| **Cache** | None | Redis (Upstash) |
| **Sync** | N/A | WebSockets (Socket.io or Pusher) |
| **Auth** | None | NextAuth.js (GitHub, Google, Email) |
| **API** | Next.js API routes | tRPC or GraphQL (type-safe) |
| **Storage** | Local filesystem | S3-compatible (project files, docs) |
| **Search** | SQLite FTS | Algolia or Meilisearch |
| **AI Orchestration** | Local (user's keys) | Cloud workers + user keys |
| **Deployment** | N/A | Vercel + Railway/Render |

---

## Data Model Changes

### Current Schema (SQLite)
```prisma
model Project {
  id          String
  name        String
  path        String @unique  // ❌ Problem: Local path won't work in cloud
  // ...
}
```

### Cloud Schema (PostgreSQL)
```prisma
model Workspace {
  id            String   @id @default(uuid())
  name          String
  slug          String   @unique
  plan          String   @default("free")  // free, pro, team, enterprise
  createdAt     DateTime @default(now())

  owner         User     @relation(fields: [ownerId], references: [id])
  ownerId       String
  members       WorkspaceMember[]
  projects      Project[]
  invites       WorkspaceInvite[]

  // Limits based on plan
  maxProjects   Int      @default(5)
  maxMembers    Int      @default(1)
  aiCredits     Int      @default(100)
}

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  name          String?
  avatarUrl     String?

  // Auth
  passwordHash  String?
  githubId      String?  @unique
  googleId      String?  @unique

  // Preferences
  defaultAI     String   @default("claude")  // claude, openai
  theme         String   @default("system")  // light, dark, system

  // Owned workspaces
  workspaces    Workspace[]
  memberships   WorkspaceMember[]

  createdAt     DateTime @default(now())
  lastSeenAt    DateTime @default(now())
}

model WorkspaceMember {
  id          String   @id @default(uuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  role        String   @default("member")  // owner, admin, member, viewer

  createdAt   DateTime @default(now())

  @@unique([workspaceId, userId])
}

model Project {
  id              String   @id @default(uuid())
  workspaceId     String
  workspace       Workspace @relation(fields: [workspaceId], references: [id])

  name            String

  // Changed: No longer local path, now remote reference
  repoUrl         String?
  syncedPath      String?  // Last synced local path (for context)

  // Same as before
  description     String?
  status          String   @default("active")
  parentProjectId String?

  tasks           Task[]
  insights        ProjectInsight[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([workspaceId])
}

model Task {
  id            String   @id @default(uuid())
  projectId     String
  project       Project  @relation(fields: [projectId], references: [id])

  // Same as before...
  title         String
  description   String?
  status        String   @default("todo")
  priority      String   @default("medium")
  agentType     String?

  // New: Assignment
  assigneeId    String?
  assignee      User?    @relation(fields: [assigneeId], references: [id])

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([projectId])
  @@index([assigneeId])
}

model SyncState {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  workspaceId     String

  lastSyncAt      DateTime @default(now())
  lastSyncVersion Int      @default(0)
  deviceId        String   // Unique ID for user's device
  deviceName      String   // "MacBook Pro", "Work Laptop"

  @@unique([userId, workspaceId, deviceId])
}
```

---

## Sync Strategy

### Option 1: Operational Transformation (OT)
**Pros**: Battle-tested (Google Docs, Figma)
**Cons**: Complex to implement
**Best for**: Real-time collaborative editing

### Option 2: Conflict-Free Replicated Data Types (CRDTs)
**Pros**: Automatic conflict resolution
**Cons**: Large payload sizes
**Best for**: Offline-first apps

### ⭐ **Option 3: Event Sourcing + Last-Write-Wins (Recommended)**
**Pros**: Simple, predictable, scales well
**Cons**: Potential conflicts (rare for PM tools)
**Best for**: VibeFlow use case

#### How It Works

```typescript
// Every change generates an event
type SyncEvent = {
  id: string
  workspaceId: string
  userId: string
  entityType: 'project' | 'task' | 'insight' | 'kb_document'
  entityId: string
  action: 'create' | 'update' | 'delete'
  data: any
  timestamp: Date
  version: number  // Monotonic counter
}

// Client sends events to cloud
POST /api/sync/events
{
  events: [
    { action: 'update', entityType: 'task', entityId: 'abc', data: { status: 'done' } }
  ]
}

// Cloud broadcasts to all connected clients via WebSocket
WS -> { type: 'sync', events: [...] }

// Clients apply events if version > local version
if (event.version > localVersion) {
  applyEvent(event)
  localVersion = event.version
}
```

### Conflict Resolution Rules

1. **Last-Write-Wins (LWW)**: Most recent timestamp wins
2. **User Priority**: Owner > Admin > Member
3. **Smart Merging**:
   - Task title changes: LWW
   - Task status changes: LWW
   - Task assignments: Merge (multiple assignees allowed)
   - Comments: Append (never conflict)

---

## Features Matrix

### MVP Features (Phase 1)

| Feature | Local | Cloud | Notes |
|---------|-------|-------|-------|
| **Project scanning** | ✅ | ❌ | Local only (accesses filesystem) |
| **Task management** | ✅ | ✅ | Full sync |
| **AI analysis** | ✅ | ✅ | User brings own keys OR workspace credits |
| **Knowledge base** | ✅ | ✅ | Full sync |
| **MCP server** | ✅ | ✅ | Local client + cloud API |
| **Multi-repo linking** | ✅ | ✅ | Full sync |
| **Team collaboration** | ❌ | ✅ | **New feature** |
| **Real-time updates** | ❌ | ✅ | **New feature** |
| **Role-based access** | ❌ | ✅ | **New feature** |
| **Activity feed** | ❌ | ✅ | **New feature** |

### Advanced Features (Phase 2)

- **Integrations**: Slack, Discord, Linear, Jira import
- **Webhooks**: Trigger on task completion, project analysis
- **API**: Public REST API for custom integrations
- **GitHub App**: Auto-sync repos, create tasks from issues
- **AI Credits**: Shared workspace AI usage (no personal keys needed)
- **Advanced Search**: Full-text search across all projects
- **Analytics**: Team velocity, agent effectiveness, completion trends
- **Custom Agents**: User-defined agents with custom prompts
- **White-label**: Self-hosted enterprise version

---

## Pricing Strategy

### Free Tier
- 1 workspace
- 5 projects
- 1 user
- 100 AI credits/month (≈10 project analyses)
- Local-only MCP
- Community support

### Pro Tier ($15/month)
- Unlimited projects
- 3 users
- 1,000 AI credits/month
- Cloud sync
- Priority support
- Advanced search

### Team Tier ($49/month)
- Everything in Pro
- 10 users
- 5,000 AI credits/month
- Role-based access
- Activity feed
- Slack/Discord integration
- SSO (GitHub, Google)

### Enterprise Tier (Custom)
- Everything in Team
- Unlimited users
- Unlimited AI credits OR bring own keys
- Self-hosted option
- Custom agents
- White-label
- SLA + dedicated support
- On-premise deployment

---

## Migration Path

### Step 1: User Clicks "Sync to Cloud"

```typescript
// settings/page.tsx
<button onClick={handleSyncToCloud}>
  ☁️ Sync to Cloud
</button>

// Opens modal
async function handleSyncToCloud() {
  // 1. Check if user is authenticated
  if (!user) {
    router.push('/auth/signup?from=sync')
    return
  }

  // 2. Show pre-upload summary
  const summary = await fetchLocalData()
  // "You have 10 projects, 150 tasks, 25 docs. Continue?"

  // 3. Upload in background
  await uploadLocalData(summary)

  // 4. Enable auto-sync
  await enableAutoSync()

  // 5. Show success
  toast.success("Cloud sync enabled! Your data is now available everywhere.")
}
```

### Step 2: Data Upload

```typescript
async function uploadLocalData() {
  // Fetch all local data
  const projects = await prisma.project.findMany({ include: { tasks: true, insights: true } })
  const knowledgeBase = await prisma.knowledgeBaseDocument.findMany({ include: { tags: true } })

  // Upload in batches (avoid timeouts)
  await uploadBatch('/api/sync/projects', projects, batchSize: 10)
  await uploadBatch('/api/sync/knowledge-base', knowledgeBase, batchSize: 20)

  // Store sync state
  await prisma.syncState.create({
    data: {
      lastSyncAt: new Date(),
      lastSyncVersion: 1,
      deviceId: getDeviceId(),
      workspaceId: user.defaultWorkspaceId
    }
  })
}
```

### Step 3: Real-Time Sync

```typescript
// lib/sync/client.ts
class SyncClient {
  ws: WebSocket

  connect() {
    this.ws = new WebSocket(`wss://cloud.vibeflow.app/sync?token=${authToken}`)

    this.ws.on('message', (event) => {
      this.handleSyncEvent(JSON.parse(event.data))
    })
  }

  async handleSyncEvent(event: SyncEvent) {
    // Update local database
    if (event.action === 'update') {
      await prisma[event.entityType].update({
        where: { id: event.entityId },
        data: event.data
      })
    }

    // Notify UI to refresh
    eventBus.emit('sync:update', event)
  }

  async pushLocalChange(change: LocalChange) {
    // Send to cloud
    await fetch('/api/sync/events', {
      method: 'POST',
      body: JSON.stringify({ events: [change] })
    })
  }
}
```

---

## Security Considerations

### 1. API Keys Storage
**Problem**: User's Anthropic/OpenAI keys need to be stored in cloud

**Solutions**:
- **Option A**: Encrypt with user password (they must enter password to decrypt)
- **Option B**: Use workspace AI credits (no personal keys stored)
- **⭐ Option C (Recommended)**: Hybrid approach
  - Free tier: Must bring own keys (encrypted)
  - Paid tier: Use workspace credits OR bring own keys

### 2. Code Visibility
**Problem**: Users may not want to upload entire codebases to cloud

**Solution**:
- Only upload metadata (project name, description, repoUrl)
- README content (optional, user can disable)
- Generated tasks/insights (no source code)
- Local scanning always happens on user's machine

### 3. Multi-Tenancy
**Problem**: Ensure users can't access other workspaces' data

**Solution**:
```sql
-- Row-Level Security (RLS) in PostgreSQL
CREATE POLICY workspace_isolation ON projects
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = current_user_id()
  ));
```

### 4. Data Encryption
- **At Rest**: PostgreSQL encryption + encrypted columns for sensitive data
- **In Transit**: TLS 1.3 for all connections
- **Backups**: Encrypted S3 backups with versioning

---

## Deployment Architecture

### Recommended: Vercel + Supabase

```
┌─────────────────────────────────────────┐
│           Vercel Edge Network           │
│                                         │
│  • Next.js app (globally distributed)  │
│  • API routes (serverless functions)   │
│  • WebSocket connections (edge)        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│              Supabase                   │
│                                         │
│  • PostgreSQL (with RLS)               │
│  • Real-time (WebSocket subscriptions) │
│  • Auth (JWT-based)                    │
│  • Storage (S3-compatible)             │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│          Redis (Upstash)                │
│                                         │
│  • Session storage                     │
│  • Rate limiting                       │
│  • Job queue (Bull/BullMQ)             │
└─────────────────────────────────────────┘
```

**Estimated Costs (1,000 users)**:
- Vercel Pro: $20/month
- Supabase Pro: $25/month
- Upstash Redis: $10/month
- **Total: ~$55/month**

**Scaling**:
- 10,000 users: ~$200/month
- 100,000 users: ~$1,500/month

---

## Open Questions

### Technical
- [ ] Should we support offline mode? (Service Workers + IndexedDB)
- [ ] How to handle project scanning in cloud? (GitHub App integration?)
- [ ] Should MCP server run in cloud or stay local?
- [ ] WebSocket vs Server-Sent Events (SSE) for sync?
- [ ] How to handle large file uploads (>10MB READMEs)?

### Product
- [ ] Should free tier get cloud sync? (Even read-only?)
- [ ] How to price AI credits? ($1 per 100 credits?)
- [ ] Team plan: per-seat or flat rate?
- [ ] Should we allow public project sharing? (Read-only links)
- [ ] GitHub App: Auto-create tasks from issues/PRs?

### Business
- [ ] Self-hosted option pricing? (One-time or annual?)
- [ ] White-label pricing? (Percentage of customer revenue?)
- [ ] Enterprise SLA terms? (99.9% uptime?)
- [ ] Payment processing: Stripe only or add PayPal/crypto?

---

## Roadmap

### Phase 0: Pre-Cloud (Current)
- ✅ Local SQLite app working
- ✅ Multi-repo support
- ✅ Knowledge base
- ✅ MCP integration

### Phase 1: Cloud MVP (Q2 2025)
- [ ] User authentication (GitHub OAuth)
- [ ] PostgreSQL migration
- [ ] Basic sync (projects, tasks, insights)
- [ ] Team invites (up to 3 users)
- [ ] Pricing page + Stripe integration
- [ ] "Sync to Cloud" button in settings

### Phase 2: Team Features (Q3 2025)
- [ ] Real-time collaboration
- [ ] Activity feed
- [ ] Role-based access (owner, admin, member, viewer)
- [ ] Slack/Discord notifications
- [ ] Advanced search
- [ ] Team analytics

### Phase 3: Enterprise (Q4 2025)
- [ ] SSO (SAML)
- [ ] Self-hosted option
- [ ] White-label
- [ ] Custom agents
- [ ] Audit logs
- [ ] Dedicated support

---

## Success Metrics

### Technical Metrics
- Sync latency: <500ms (p95)
- Uptime: >99.9%
- DB query time: <100ms (p95)
- WebSocket connection stability: >99%

### Product Metrics
- Local-to-cloud conversion: >40%
- Team invite acceptance: >70%
- DAU/MAU ratio: >0.3
- Churn: <5% monthly
- NPS: >50

### Business Metrics
- Free → Pro conversion: >5%
- Pro → Team conversion: >15%
- Average revenue per user (ARPU): >$20/month
- Customer acquisition cost (CAC): <$100
- Lifetime value (LTV): >$500

---

## Next Steps

1. **Validate with users**: Survey current users about cloud needs
2. **Prototype auth**: Build GitHub OAuth + basic workspace creation
3. **Test sync**: Build proof-of-concept sync for tasks only
4. **Pricing research**: Analyze competitors (Linear, Jira, Notion pricing)
5. **Infrastructure setup**: Set up Vercel + Supabase staging environment
6. **Spec API**: Write OpenAPI spec for cloud API
7. **Design team UI**: Mockups for team invite, activity feed, roles

---

## Appendix

### Competitor Analysis

| Feature | VibeFlow Cloud | Linear | Notion | Jira |
|---------|---------------|--------|--------|------|
| **AI task generation** | ✅ | ❌ | ❌ | ❌ |
| **Multi-repo support** | ✅ | ❌ | ❌ | Partial |
| **Local-first** | ✅ | ❌ | ❌ | ❌ |
| **MCP integration** | ✅ | ❌ | ❌ | ❌ |
| **Team collaboration** | ✅ | ✅ | ✅ | ✅ |
| **Starting price** | $15/mo | $8/mo | $10/mo | $7.75/mo |
| **Free tier projects** | 5 | 1 | Unlimited pages | 10 users |

### References

- [Supabase Real-time](https://supabase.com/docs/guides/realtime)
- [tRPC](https://trpc.io/) - Type-safe API layer
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [Stripe Billing](https://stripe.com/billing) - Subscription management
- [Figma's approach to sync](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-16
**Status**: Draft - Open for feedback

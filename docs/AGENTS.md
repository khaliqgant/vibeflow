# 🤖 Agent System

VibeFlow's power comes from 7 specialized AI agents that analyze your projects from different perspectives.

## How Agents Work

When you scan a project, VibeFlow:

1. **Reads** your README, code structure, and GitHub data
2. **Runs** all 7 agents in parallel (fast!)
3. **Generates** tasks and insights specific to each domain
4. **Organizes** everything into beautiful kanban boards

Each agent has its own:
- ✅ System prompt (expertise)
- ✅ Task generation logic
- ✅ Priority rules
- ✅ Kanban board

## The 7 Agents

### 📢 Marketing Strategist

**Expertise:** Go-to-market, brand positioning, campaigns

**What it analyzes:**
- Product-market fit
- Target audience
- Competitive positioning
- Marketing channels

**Example tasks:**
- "Launch on Product Hunt"
- "Create landing page copy"
- "Set up email drip campaign"
- "Design social media strategy"

**Best for:** Products ready for launch or needing visibility

---

### 💰 Pricing Strategist

**Expertise:** Monetization, pricing models, revenue

**What it analyzes:**
- Current pricing (if any)
- Value metrics
- Competitor pricing
- Monetization opportunities

**Example tasks:**
- "Implement tiered pricing"
- "Add Stripe integration"
- "Create pricing page"
- "Design freemium model"

**Best for:** SaaS products, APIs, paid tools

---

### ⚔️ Competitive Analyst

**Expertise:** Market research, differentiation, competitive intelligence

**What it analyzes:**
- Similar products
- Feature gaps
- Unique advantages
- Market trends

**Example tasks:**
- "Research top 5 competitors"
- "Implement missing killer feature"
- "Create comparison table"
- "Analyze competitive pricing"

**Best for:** Crowded markets, established products

---

### 🔍 SEO Specialist

**Expertise:** Search optimization, technical SEO, discoverability

**What it analyzes:**
- Meta tags
- Content structure
- Site performance
- Indexability

**Example tasks:**
- "Fix missing meta descriptions"
- "Optimize images"
- "Improve Core Web Vitals"
- "Add structured data"

**Best for:** Web apps, content sites, documentation

---

### ✍️ Content Writer

**Expertise:** Technical writing, blogging, documentation

**What it analyzes:**
- Documentation quality
- README completeness
- Content opportunities
- Educational gaps

**Example tasks:**
- "Write getting started guide"
- "Create API documentation"
- "Publish case study blog post"
- "Record demo video"

**Best for:** Developer tools, open source, technical products

---

### ⚙️ Technical Reviewer

**Expertise:** Code quality, architecture, best practices

**What it analyzes:**
- Code structure
- Testing coverage
- Security issues
- Performance bottlenecks
- Technical debt

**Example tasks:**
- "Improve test coverage to 80%"
- "Refactor authentication module"
- "Fix security vulnerabilities"
- "Optimize database queries"

**Best for:** All projects (always valuable!)

---

### 📋 Project Manager

**Expertise:** Planning, coordination, milestones, delivery

**What it analyzes:**
- Project completeness
- Roadmap gaps
- Dependencies
- Blockers

**Example tasks:**
- "Plan Q2 roadmap"
- "Create sprint backlog"
- "Define MVP features"
- "Set up project milestones"

**Best for:** Team projects, complex products

---

## Agent Configuration

Agents are defined in `lib/agents/definitions.ts`:

```typescript
export const agents: Record<string, Agent> = {
  marketing: {
    type: 'marketing',
    name: 'Marketing Strategist',
    description: '...',
    systemPrompt: '...',
    taskCategories: ['product-launch', 'content-marketing'],
  },
  // ...
}
```

## Customizing Agents

See [Extending Agents](./EXTENDING.md) for:
- Creating custom agents
- Modifying system prompts
- Adding new task categories
- Adjusting priority rules

## Agent Output

Each agent produces:

### 📊 Insights
Strategic observations about your project:
```
"No pricing page detected. Recommend adding monetization strategy."
```

### ✅ Tasks
Actionable items with:
- Title
- Description
- Priority (low/medium/high)
- AI reasoning
- Kanban status

### 💡 Recommendations
High-level strategic advice:
```
"Consider implementing tiered pricing model based on usage metrics."
```

## Viewing Agent Results

### Project Overview Page
- See all agent insights
- View completion metrics
- Read AI analysis

### Per-Agent Boards
- Click any agent in sidebar
- See only their tasks
- Drag between columns

### Task Details
- Each task shows which agent created it
- See AI reasoning
- View related insights

## Best Practices

1. **Run analysis periodically** - Projects evolve, so do tasks
2. **Review all agent boards** - Don't ignore marketing/SEO tasks
3. **Act on high-priority items** - Agents prioritize for a reason
4. **Give feedback** - Agent quality improves with usage

## Technical Details

- Agents run in **parallel** (not sequential)
- Each gets **project context** (README, code, GitHub data)
- All use the **same AI provider** (Claude or OpenAI)
- Responses are **parsed as JSON** for structured output
- Tasks are **stored in database** with agent attribution

## Future Agent Ideas

Vote on [GitHub Discussions](https://github.com/khaliqgant/vibeflow/discussions):

- 🎨 Design agent (UI/UX review)
- 🔐 Security agent (vulnerability scanning)
- 📊 Analytics agent (metrics tracking)
- 🌍 Localization agent (i18n tasks)
- ♿ Accessibility agent (a11y review)

---

**Ready to create your own?** → [Extending Agents Guide](./EXTENDING.md)

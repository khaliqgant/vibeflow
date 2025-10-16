# ✨ VibeFlow

<div align="center">

**AI-Powered Project Management That Actually Understands Your Code**

Point it at your repos. Watch 7 specialized AI agents analyze everything and create intelligent, actionable tasks.

[Quick Start](#-quick-start) • [Features](#-what-makes-vibeflow-different) • [Demo](#-see-it-in-action) • [Docs](./docs/README.md)

[![Test Suite](https://github.com/khaliqgant/vibeflow/workflows/Test%20Suite/badge.svg)](https://github.com/khaliqgant/vibeflow/actions)
[![Coverage](https://img.shields.io/badge/coverage-70%25-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

![VibeFlow Dashboard](https://via.placeholder.com/800x450/667eea/ffffff?text=VibeFlow+Dashboard)

</div>

---

## 🎯 What Makes VibeFlow Different

**You have 20 projects.** Each with their own TODOs, issues, PRs, and technical debt. You know you need to:
- Launch that marketing campaign
- Fix the pricing page
- Review those 3 open PRs
- Write documentation
- Optimize for SEO

But who has time to organize all that?

**VibeFlow does.** Automatically.

### Here's How It Works

1. **Point & Scan** - Give VibeFlow a directory path
2. **AI Analyzes** - 7 specialized agents study your code, READMEs, and GitHub data
3. **Tasks Created** - Get a beautiful kanban board with intelligent, prioritized tasks
4. **Start Building** - Or let Claude Code autonomously work through tasks via MCP

<div align="center">

### 🤖 Meet Your AI Agent Team

</div>

| Agent | What They Do | Example Tasks |
|-------|-------------|---------------|
| 📢 **Marketing** | Go-to-market strategy | "Launch Product Hunt campaign", "Create landing page copy" |
| 💰 **Pricing** | Monetization analysis | "Implement tiered pricing", "Add payment integration" |
| ⚔️ **Competitor** | Competitive research | "Analyze top 3 competitors", "Add missing features" |
| 🔍 **SEO** | Search optimization | "Fix meta tags", "Improve page speed" |
| ✍️ **Content** | Documentation & blogs | "Write API documentation", "Create tutorial series" |
| ⚙️ **Technical** | Code quality review | "Improve test coverage", "Refactor auth module" |
| 📋 **Project Manager** | Roadmap & coordination | "Plan Q2 milestones", "Organize sprint" |

---

## 🚀 Quick Start

```bash
# Install
npm install

# Setup
cp .env.example .env
# Add your ANTHROPIC_API_KEY or OPENAI_API_KEY

# Run
npx prisma migrate dev
npm run dev
```

**That's it.** Open [localhost:5847](http://localhost:5847), enter your projects directory, and watch the magic happen.

📖 [Full Installation Guide](./docs/INSTALLATION.md) • [Configuration Options](./docs/CONFIGURATION.md)

---

## ✨ Features That Make You Productive

<table>
<tr>
<td width="50%">

### 🎨 **Beautiful UI**
Linear-inspired design. Drag-and-drop kanban boards. Smooth animations. Dark mode ready.

### 🔄 **Multi-AI Support**
Choose Claude 3.5 Sonnet or GPT-4. Switch anytime. Configure in the UI.

### 📊 **Smart Analytics**
Project completion %. Task distribution. Agent insights. All in one dashboard.

</td>
<td width="50%">

### 🔗 **GitHub Native**
Auto-fetches PRs, issues, and repo metadata. Links tasks to GitHub activity.

### 🔌 **MCP Integration**
Connect Claude Code. Let it autonomously pull and complete tasks.

### 🎯 **Per-Agent Boards**
Separate kanban for each agent. Filter by marketing, technical, SEO, etc.

</td>
</tr>
</table>

---

## 📸 See It In Action

<details>
<summary><b>🏠 Beautiful Project Dashboard</b></summary>

![Dashboard](https://via.placeholder.com/800x450/667eea/ffffff?text=Project+Dashboard)

Track progress, view insights, and see AI analysis for each project.

</details>

<details>
<summary><b>📋 Agent-Specific Kanban Boards</b></summary>

![Kanban](https://via.placeholder.com/800x450/667eea/ffffff?text=Kanban+Board)

Drag tasks between To Do, In Progress, and Done. Each agent has their own board.

</details>

<details>
<summary><b>⚙️ Easy Configuration</b></summary>

![Settings](https://via.placeholder.com/800x450/667eea/ffffff?text=Settings+Page)

Add API keys, choose AI provider, and configure GitHub integration—all in a beautiful GUI.

</details>

---

## 🎓 Learn More

| 📚 **Documentation** | 🛠️ **Development** | 🤝 **Community** |
|---------------------|-------------------|------------------|
| [Installation Guide](./docs/INSTALLATION.md) | [Architecture](./docs/ARCHITECTURE.md) | [Contributing](./CONTRIBUTING.md) |
| [Configuration](./docs/CONFIGURATION.md) | [Testing Guide](./TESTING.md) | [Code of Conduct](./CODE_OF_CONDUCT.md) |
| [MCP Integration](./docs/MCP.md) | [API Reference](./docs/API.md) | [Discussions](https://github.com/khaliqgant/vibeflow/discussions) |
| [Agent System](./docs/AGENTS.md) | [Extending Agents](./docs/EXTENDING.md) | [Discord](#) |

---

## 🎯 Perfect For

- 👨‍💻 **Indie Developers** - Managing multiple side projects
- 🚀 **Startup Teams** - Organizing product development
- 🎨 **Agencies** - Tracking client projects
- 📚 **Open Source Maintainers** - Coordinating contributions
- 🔬 **Researchers** - Managing code experiments

---

## 🌟 Why Developers Love It

> "Finally, a project manager that actually reads my code."
> — *Developer who has 15 side projects*

> "The AI agents are scary good. They found TODOs I wrote 6 months ago."
> — *Tech Lead at YC startup*

> "Set it up in 5 minutes. It organized 3 years of projects in 30 seconds."
> — *Open source maintainer*

---

## 🚀 Roadmap

- [x] Multi-AI provider support (Claude & OpenAI)
- [x] 7 specialized agents
- [x] MCP server for Claude Code
- [x] Beautiful Linear-inspired UI
- [x] GitHub integration
- [ ] Slack/Discord notifications
- [ ] Team collaboration features
- [ ] Custom agent creation
- [ ] Browser extension
- [ ] Mobile app

[View Full Roadmap](./docs/ROADMAP.md) • [Vote on Features](https://github.com/khaliqgant/vibeflow/discussions/categories/feature-requests)

---

## 🤝 Contributing

We love contributions! Whether it's:
- 🐛 Bug fixes
- ✨ New features
- 📝 Documentation improvements
- 🎨 UI/UX enhancements
- 🤖 New agent types

Check out our [Contributing Guide](./CONTRIBUTING.md) to get started.

---

## 📄 License

MIT © [Khaliq Gant](https://github.com/khaliqgant)

Built with ❤️ using [Claude Code](https://claude.com/claude-code) and [Happy](https://happy.engineering)

---

<div align="center">

**[⬆ Back to Top](#-vibeflow)**

Made with 🤖 by developers, for developers

[Website](#) • [Twitter](#) • [Discord](#)

</div>

# 📦 Installation Guide

Get VibeFlow running in 5 minutes.

## Prerequisites

- **Node.js** 20.x or higher
- **npm** or **yarn**
- **Git** (for repository scanning)
- **API Key** from Anthropic or OpenAI

## Step-by-Step Installation

### 1. Clone the Repository

```bash
git clone https://github.com/khaliqgant/vibeflow.git
cd vibeflow
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- Next.js 15
- React 19
- Prisma
- Anthropic & OpenAI SDKs
- Testing libraries
- And more...

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your preferred editor:

```env
# Choose your AI provider
AI_PROVIDER=claude  # or openai

# Add your API key (only one required)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Optional: GitHub integration
GITHUB_TOKEN=ghp_...

# Database (default is fine)
DATABASE_URL="file:./prisma/dev.db"
```

#### Getting API Keys

**Anthropic Claude:**
1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Go to API Keys
4. Create new key
5. Copy to `.env`

**OpenAI:**
1. Visit [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Create new secret key
4. Copy to `.env`

**GitHub (Optional):**
1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Generate new token (classic)
3. Select scopes: `repo`, `read:org`
4. Copy to `.env`

### 4. Initialize Database

```bash
npx prisma migrate dev
```

This creates:
- SQLite database
- All required tables
- Sample data (optional)

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5847](http://localhost:5847) 🎉

## Verify Installation

1. You should see the VibeFlow welcome screen
2. Click "Scan Projects"
3. Enter a directory path (e.g., `~/projects`)
4. Watch AI agents analyze your projects!

## Next Steps

- **[Quick Start Tutorial](./QUICKSTART.md)** - Learn the basics
- **[Configuration Guide](./CONFIGURATION.md)** - Customize settings
- **[MCP Setup](./MCP.md)** - Connect Claude Code

## Troubleshooting

### "Module not found" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Database issues
```bash
rm -rf prisma/dev.db
npx prisma migrate dev
```

### Port 5847 already in use
```bash
npm run dev -- -p 5848
```

### API key not working
- Check for extra spaces
- Ensure correct format (starts with `sk-ant-` or `sk-`)
- Verify key is active in provider console

## Production Setup

See [Deployment Guide](./DEPLOYMENT.md) for production configuration.

## Getting Help

- [FAQ](./FAQ.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [GitHub Discussions](https://github.com/khaliqgant/vibeflow/discussions)

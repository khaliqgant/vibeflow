import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const SETTINGS_FILE = path.join(process.cwd(), '.vibeflow-settings.json')
const ENV_FILE = path.join(process.cwd(), '.env')

interface Settings {
  provider: 'claude' | 'openai'
}

async function loadSettings(): Promise<Settings> {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return { provider: 'claude' }
  }
}

async function saveSettings(settings: Settings): Promise<void> {
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2))
}

async function updateEnvFile(key: string, value: string): Promise<void> {
  try {
    let envContent = ''
    try {
      envContent = await fs.readFile(ENV_FILE, 'utf-8')
    } catch {
      // .env doesn't exist, create it
    }

    const lines = envContent.split('\n')
    let found = false

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith(`${key}=`)) {
        lines[i] = `${key}=${value}`
        found = true
        break
      }
    }

    if (!found) {
      lines.push(`${key}=${value}`)
    }

    await fs.writeFile(ENV_FILE, lines.join('\n'))

    // Update process.env for current session
    process.env[key] = value
  } catch (error) {
    console.error(`Failed to update ${key}:`, error)
  }
}

export async function GET() {
  try {
    const settings = await loadSettings()

    // Check which API keys are configured
    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY
    const hasGithubToken = !!process.env.GITHUB_TOKEN

    return NextResponse.json({
      ...settings,
      hasAnthropicKey,
      hasOpenAIKey,
      hasGithubToken,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const settings: Settings = {
      provider: body.provider || 'claude',
    }

    await saveSettings(settings)

    // Update environment variables
    if (body.anthropicKey) {
      await updateEnvFile('ANTHROPIC_API_KEY', body.anthropicKey)
    }
    if (body.openaiKey) {
      await updateEnvFile('OPENAI_API_KEY', body.openaiKey)
    }
    if (body.githubToken) {
      await updateEnvFile('GITHUB_TOKEN', body.githubToken)
    }
    if (settings.provider) {
      await updateEnvFile('AI_PROVIDER', settings.provider)
    }

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}

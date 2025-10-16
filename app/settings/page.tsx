'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function SettingsPage() {
  const router = useRouter()
  const [provider, setProvider] = useState<'claude' | 'openai'>('claude')
  const [anthropicKey, setAnthropicKey] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [hasAnthropicKey, setHasAnthropicKey] = useState(false)
  const [hasOpenAIKey, setHasOpenAIKey] = useState(false)
  const [hasGithubToken, setHasGithubToken] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showKeys, setShowKeys] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setProvider(data.provider || 'claude')
        setHasAnthropicKey(data.hasAnthropicKey)
        setHasOpenAIKey(data.hasOpenAIKey)
        setHasGithubToken(data.hasGithubToken)
      })
  }, [])

  const handleSave = async () => {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        anthropicKey: anthropicKey || undefined,
        openaiKey: openaiKey || undefined,
        githubToken: githubToken || undefined,
      }),
    })
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      window.location.reload()
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
              >
                ←
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-sm text-gray-400">Configure VibeFlow AI and integrations</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={!anthropicKey && !openaiKey && !githubToken && !saved}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all font-medium shadow-sm hover:shadow-md"
            >
              {saved ? (
                <span className="flex items-center gap-2">
                  <span>✓</span> Saved
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* AI Provider Selection */}
        <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700 bg-gray-800/50">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              🤖 AI Provider
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Choose which AI model powers your project analysis
            </p>
          </div>

          <div className="p-6 space-y-4">
            {/* Claude Option */}
            <div
              onClick={() => setProvider('claude')}
              className={`group relative p-6 border-2 rounded-xl cursor-pointer transition-all ${
                provider === 'claude'
                  ? 'border-pink-500 bg-pink-900/20 shadow-md'
                  : 'border-gray-600 hover:border-gray-500 hover:shadow-sm bg-gray-700/30'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  A
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-white">Anthropic Claude</h3>
                    <span className="px-2 py-0.5 bg-purple-900/50 text-purple-300 text-xs font-semibold rounded-full">
                      Recommended
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">
                    Claude 3.5 Sonnet - Best for complex reasoning, long context, and detailed code review
                  </p>
                  <div className="flex items-center gap-2">
                    {hasAnthropicKey ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-3 py-1 rounded-full font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-full font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Not configured
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    provider === 'claude'
                      ? 'border-pink-500 bg-pink-500'
                      : 'border-gray-500 group-hover:border-gray-400'
                  }`}
                >
                  {provider === 'claude' && (
                    <div className="w-3 h-3 rounded-full bg-white" />
                  )}
                </div>
              </div>
            </div>

            {/* OpenAI Option */}
            <div
              onClick={() => setProvider('openai')}
              className={`group relative p-6 border-2 rounded-xl cursor-pointer transition-all ${
                provider === 'openai'
                  ? 'border-cyan-500 bg-cyan-900/20 shadow-md'
                  : 'border-gray-600 hover:border-gray-500 hover:shadow-sm bg-gray-700/30'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  O
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-white">OpenAI</h3>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">
                    GPT-4 Turbo - Fast, reliable, and great for general-purpose analysis
                  </p>
                  <div className="flex items-center gap-2">
                    {hasOpenAIKey ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-3 py-1 rounded-full font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-full font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Not configured
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    provider === 'openai'
                      ? 'border-cyan-500 bg-cyan-500'
                      : 'border-gray-500 group-hover:border-gray-400'
                  }`}
                >
                  {provider === 'openai' && (
                    <div className="w-3 h-3 rounded-full bg-white" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* API Keys Configuration */}
        <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700 bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  🔑 API Keys
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Securely stored and encrypted
                </p>
              </div>
              <button
                onClick={() => setShowKeys(!showKeys)}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium"
              >
                {showKeys ? '🙈 Hide' : '👁️ Show'}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Anthropic Key */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Anthropic Claude API Key
              </label>
              <div className="relative">
                <input
                  type={showKeys ? 'text' : 'password'}
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder={hasAnthropicKey ? '••••••••••••••••' : 'sk-ant-api03-...'}
                  className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all font-mono text-sm placeholder:text-gray-500"
                />
                {hasAnthropicKey && !anthropicKey && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="text-xs text-green-400 bg-green-900/50 px-2 py-1 rounded-full font-medium">
                      ✓ Set
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Get your key at{' '}
                <a
                  href="https://console.anthropic.com"
                  target="_blank"
                  className="text-blue-400 hover:underline"
                >
                  console.anthropic.com
                </a>
              </p>
            </div>

            {/* OpenAI Key */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                OpenAI API Key
              </label>
              <div className="relative">
                <input
                  type={showKeys ? 'text' : 'password'}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder={hasOpenAIKey ? '••••••••••••••••' : 'sk-...'}
                  className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-mono text-sm placeholder:text-gray-500"
                />
                {hasOpenAIKey && !openaiKey && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="text-xs text-green-400 bg-green-900/50 px-2 py-1 rounded-full font-medium">
                      ✓ Set
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Get your key at{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  className="text-blue-400 hover:underline"
                >
                  platform.openai.com/api-keys
                </a>
              </p>
            </div>

            {/* GitHub Token */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                GitHub Personal Access Token
                <span className="ml-2 text-xs text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type={showKeys ? 'text' : 'password'}
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder={hasGithubToken ? '••••••••••••••••' : 'ghp_...'}
                  className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm placeholder:text-gray-500"
                />
                {hasGithubToken && !githubToken && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="text-xs text-green-400 bg-green-900/50 px-2 py-1 rounded-full font-medium">
                      ✓ Set
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Required for PR and issue integration •{' '}
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  className="text-blue-400 hover:underline"
                >
                  Generate token
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-6 text-white border border-blue-500/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">
              🔒
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Your keys are secure</h3>
              <p className="text-blue-100 text-sm">
                API keys are stored locally in your environment and never sent to external servers.
                They're used only to communicate directly with AI providers.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

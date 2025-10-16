interface AgentBadgeProps {
  agentType: string
}

const agentColors: Record<string, string> = {
  marketing: 'bg-purple-100 text-purple-800',
  pricing: 'bg-green-100 text-green-800',
  competitor: 'bg-orange-100 text-orange-800',
  seo: 'bg-blue-100 text-blue-800',
  blogging: 'bg-pink-100 text-pink-800',
  technical: 'bg-gray-100 text-gray-800',
  pm: 'bg-indigo-100 text-indigo-800',
}

const agentIcons: Record<string, string> = {
  marketing: '📢',
  pricing: '💰',
  competitor: '⚔️',
  seo: '🔍',
  blogging: '✍️',
  technical: '⚙️',
  pm: '📋',
}

export function AgentBadge({ agentType }: AgentBadgeProps) {
  const color = agentColors[agentType] || 'bg-gray-100 text-gray-800'
  const icon = agentIcons[agentType] || '🤖'

  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${color}`}>
      <span>{icon}</span>
      <span className="capitalize">{agentType}</span>
    </span>
  )
}

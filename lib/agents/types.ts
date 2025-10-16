export type AgentType =
  | 'marketing'
  | 'pricing'
  | 'competitor'
  | 'seo'
  | 'blogging'
  | 'technical'
  | 'pm'

export interface Agent {
  type: AgentType
  name: string
  description: string
  systemPrompt: string
  taskCategories: string[]
}

export interface AgentAnalysis {
  agentType: AgentType
  insights: string[]
  tasks: {
    title: string
    description: string
    priority: 'low' | 'medium' | 'high'
    reasoning: string
  }[]
  recommendations: string[]
}

export interface ProjectContext {
  name: string
  description?: string
  readme?: string
  repoUrl?: string
  techStack?: string[]
  codeStructure?: string
  packageJson?: any
  openPRs?: any[]
  openIssues?: any[]
}

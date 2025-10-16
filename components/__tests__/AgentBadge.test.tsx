import { render, screen } from '@testing-library/react'
import { AgentBadge } from '../AgentBadge'

describe('AgentBadge', () => {
  const agentTypes = [
    { type: 'marketing', icon: '📢' },
    { type: 'pricing', icon: '💰' },
    { type: 'competitor', icon: '⚔️' },
    { type: 'seo', icon: '🔍' },
    { type: 'blogging', icon: '✍️' },
    { type: 'technical', icon: '⚙️' },
    { type: 'pm', icon: '📋' },
  ]

  agentTypes.forEach(({ type, icon }) => {
    it(`should render ${type} agent with correct icon`, () => {
      render(<AgentBadge agentType={type} />)
      expect(screen.getByText(icon)).toBeInTheDocument()
      expect(screen.getByText(type)).toBeInTheDocument()
    })

    it(`should capitalize ${type} agent name`, () => {
      render(<AgentBadge agentType={type} />)
      const text = screen.getByText(type)
      expect(text).toHaveClass('capitalize')
    })
  })

  it('should render unknown agent with default icon', () => {
    render(<AgentBadge agentType="unknown" />)
    expect(screen.getByText('🤖')).toBeInTheDocument()
    expect(screen.getByText('unknown')).toBeInTheDocument()
  })

  it('should have correct styling classes', () => {
    const { container } = render(<AgentBadge agentType="technical" />)
    const badge = container.querySelector('span')
    expect(badge).toHaveClass('inline-flex', 'items-center', 'gap-1', 'text-xs', 'px-2', 'py-1', 'rounded')
  })
})

import { render, screen } from '@testing-library/react'
import { TaskCard } from '../TaskCard'
import { DndContext } from '@dnd-kit/core'

const mockTask = {
  id: '1',
  title: 'Test Task',
  description: 'Test description',
  priority: 'high',
  status: 'todo',
  agentType: 'technical',
  aiReasoning: 'This is important because...',
}

const renderWithDnd = (component: React.ReactElement) => {
  return render(<DndContext>{component}</DndContext>)
}

describe('TaskCard', () => {
  it('should render task title', () => {
    renderWithDnd(<TaskCard task={mockTask} onUpdate={jest.fn()} />)
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('should render task description', () => {
    renderWithDnd(<TaskCard task={mockTask} onUpdate={jest.fn()} />)
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('should render priority badge', () => {
    renderWithDnd(<TaskCard task={mockTask} onUpdate={jest.fn()} />)
    expect(screen.getByText('high')).toBeInTheDocument()
  })

  it('should render agent badge when agentType is present', () => {
    renderWithDnd(<TaskCard task={mockTask} onUpdate={jest.fn()} />)
    expect(screen.getByText('technical')).toBeInTheDocument()
  })

  it('should render AI reasoning when present', () => {
    renderWithDnd(<TaskCard task={mockTask} onUpdate={jest.fn()} />)
    expect(screen.getByText('This is important because...')).toBeInTheDocument()
  })

  it('should not render description when not provided', () => {
    const taskWithoutDesc = { ...mockTask, description: undefined }
    renderWithDnd(<TaskCard task={taskWithoutDesc} onUpdate={jest.fn()} />)
    expect(screen.queryByText('Test description')).not.toBeInTheDocument()
  })

  it('should not render AI reasoning when not provided', () => {
    const taskWithoutReasoning = { ...mockTask, aiReasoning: undefined }
    renderWithDnd(<TaskCard task={taskWithoutReasoning} onUpdate={jest.fn()} />)
    expect(screen.queryByText('This is important because...')).not.toBeInTheDocument()
  })

  it('should apply correct priority colors', () => {
    renderWithDnd(<TaskCard task={mockTask} onUpdate={jest.fn()} />)
    const priorityBadge = screen.getByText('high').closest('span')
    expect(priorityBadge).toHaveClass('bg-red-100', 'text-red-800')
  })
})

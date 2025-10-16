'use client'

import { useDroppable } from '@dnd-kit/core'

interface KanbanColumnProps {
  id: string
  title: string
  count: number
  children: React.ReactNode
}

export function KanbanColumn({ id, title, count, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[320px] flex flex-col rounded-lg border-2 transition-colors ${
        isOver ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 bg-gray-900'
      }`}
    >
      <div className="p-4 border-b border-gray-700 bg-gray-800 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">{title}</h3>
          <span className="text-sm text-gray-400 bg-gray-700 px-2 py-1 rounded">
            {count}
          </span>
        </div>
      </div>
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

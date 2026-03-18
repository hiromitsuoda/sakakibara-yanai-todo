'use client'
import type { Todo, Status } from '@/lib/types'
import { STATUS_CONFIG } from '@/lib/types'
import TodoCard from './TodoCard'

interface Props {
  todos: Todo[]
  onUpdate: (id: string, updates: Partial<Todo>) => void
  onDelete: (id: string) => void
  onAddClick: (status: Status) => void
}

const COLUMNS: Status[] = ['overdue', 'todo', 'doing', 'done']

export default function KanbanBoard({ todos, onUpdate, onDelete, onAddClick }: Props) {
  return (
    <div className="board-scroll flex gap-4 p-4 h-full min-h-0">
      {COLUMNS.map((status) => {
        const cfg = STATUS_CONFIG[status]
        const columnTodos = todos.filter((t) => t.status === status)

        return (
          <div
            key={status}
            className="flex flex-col shrink-0 w-[300px] rounded-xl border-2"
            style={{ borderColor: cfg.borderColor }}
          >
            {/* Column header */}
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-t-xl"
              style={{ background: cfg.bgColor }}
            >
              <span>{cfg.icon}</span>
              <span className="text-sm font-bold" style={{ color: cfg.color }}>
                {cfg.label}
              </span>
              <span
                className="ml-auto w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: cfg.color }}
              >
                {columnTodos.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[80px]">
              {columnTodos.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400">
                  {status === 'done' ? '完了した案件がここに表示されます' : '該当する案件はありません'}
                </div>
              )}
              {columnTodos.map((todo) => (
                <TodoCard
                  key={todo.id}
                  todo={todo}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))}
            </div>

            {/* Add button */}
            {status !== 'done' && (
              <div className="p-2 border-t border-slate-100">
                <button
                  onClick={() => onAddClick(status)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 border-dashed border-slate-200 text-xs text-slate-400 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50 transition-all"
                >
                  ＋ カードを追加
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

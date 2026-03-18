'use client'
import { useState, useMemo, useCallback } from 'react'
import type { Todo, Status, TagType } from '@/lib/types'
import { MOCK_TODOS } from '@/data/mockData'
import Header from '@/components/Header'
import KanbanBoard from '@/components/KanbanBoard'
import ImportModal from '@/components/ImportModal'
import AddTodoModal from '@/components/AddTodoModal'
import Toast from '@/components/Toast'
import QrModal from '@/components/QrModal'

type View = 'kanban' | 'list'

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>(MOCK_TODOS)
  const [selectedStaffId, setSelectedStaffId] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTag, setActiveTag] = useState<TagType | 'all'>('all')
  const [view, setView] = useState<View>('kanban')
  const [showImport, setShowImport] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [addStatus, setAddStatus] = useState<Status | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null)

  // ── State helpers ──────────────────────────────────────────
  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type })
  }, [])

  const updateTodo = useCallback((id: string, updates: Partial<Todo>) => {
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t))
    if (updates.status === 'done') showToast('✅ 完了にしました')
    else if (updates.comment !== undefined) showToast('💬 メモを保存しました')
  }, [showToast])

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id))
    showToast('削除しました', 'info')
  }, [showToast])

  const addTodo = useCallback((todoData: Omit<Todo, 'id' | 'created_at' | 'updated_at'>) => {
    const newTodo: Todo = {
      ...todoData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setTodos((prev) => [newTodo, ...prev])
    showToast('📋 TODOを作成しました')
  }, [showToast])

  const importTodos = useCallback((newTodos: Partial<Todo>[]) => {
    const full = newTodos.map((t) => ({
      ...t,
      id: t.id ?? crypto.randomUUID(),
      comment: '',
      attachments: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })) as Todo[]
    setTodos((prev) => [...full, ...prev])
    showToast(`📥 ${full.length}件を取込みました`)
  }, [showToast])

  // ── Filtering ─────────────────────────────────────────────
  const filteredTodos = useMemo(() => {
    return todos.filter((t) => {
      const matchStaff = selectedStaffId === 'all' || t.staff_id === selectedStaffId
      const matchTag = activeTag === 'all' || t.tags.includes(activeTag)
      const q = searchQuery.toLowerCase()
      const matchSearch = !q || t.title.toLowerCase().includes(q) || (t.link_no ?? '').includes(q) || (t.detail ?? '').toLowerCase().includes(q)
      return matchStaff && matchTag && matchSearch
    })
  }, [todos, selectedStaffId, activeTag, searchQuery])

  // ── Counts ────────────────────────────────────────────────
  const counts = useMemo(() => ({
    overdue: todos.filter((t) => t.status === 'overdue').length,
    todo:    todos.filter((t) => t.status === 'todo').length,
    doing:   todos.filter((t) => t.status === 'doing').length,
    done:    todos.filter((t) => t.status === 'done').length,
  }), [todos])

  const TAG_OPTIONS: (TagType | 'all')[] = ['all', '許可申請', '変更届', '相談対応', '法人', '更新', 'その他']

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <Header
        selectedStaffId={selectedStaffId}
        onStaffChange={setSelectedStaffId}
        onImportClick={() => setShowImport(true)}
        onAddClick={() => setAddStatus('todo')}
        onQrClick={() => setShowQr(true)}
      />

      {/* Sub header */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="案件・担当者・Link番号で検索..."
            className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-52 focus:border-teal-500 focus:outline-none bg-slate-50"
          />
        </div>

        {/* Tag filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          {TAG_OPTIONS.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                activeTag === tag
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-teal-300 hover:text-teal-600'
              }`}
            >
              {tag === 'all' ? `全件 (${todos.length})` : tag}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="ml-auto flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => setView('kanban')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${view === 'kanban' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'}`}
          >
            カンバン
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${view === 'list' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'}`}
          >
            リスト
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 border-b border-slate-200 bg-white">
        {[
          { label: '期限超過', count: counts.overdue, color: 'text-red-600',   bg: 'bg-red-50' },
          { label: '未着手',   count: counts.todo,    color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: '進行中',   count: counts.doing,   color: 'text-blue-600',  bg: 'bg-blue-50' },
          { label: '完了',     count: counts.done,    color: 'text-green-600', bg: 'bg-green-50' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`flex flex-col items-center justify-center py-2 ${bg} border-r border-slate-200 last:border-r-0`}>
            <span className={`text-xl font-black leading-tight ${color}`}>{count}</span>
            <span className="text-[10px] text-slate-500 font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* Board / List */}
      <div className="flex-1 overflow-auto">
        {view === 'kanban' ? (
          <KanbanBoard
            todos={filteredTodos}
            onUpdate={updateTodo}
            onDelete={deleteTodo}
            onAddClick={(s) => setAddStatus(s)}
          />
        ) : (
          <ListView todos={filteredTodos} onUpdate={updateTodo} onDelete={deleteTodo} />
        )}
      </div>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-14 flex z-40">
        {[
          { icon: '📋', label: 'TODO', action: () => {} },
          { icon: '📅', label: 'カレンダー', action: () => {} },
          { icon: '📊', label: 'レポート', action: () => {} },
          { icon: '⚙️', label: '設定', action: () => {} },
        ].map(({ icon, label, action }) => (
          <button key={label} onClick={action} className="flex-1 flex flex-col items-center justify-center gap-0.5 text-slate-400">
            <span className="text-lg">{icon}</span>
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>

      {/* Modals */}
      {showQr && <QrModal onClose={() => setShowQr(false)} />}
      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onImport={importTodos} />
      )}
      {addStatus && (
        <AddTodoModal
          defaultStatus={addStatus}
          onClose={() => setAddStatus(null)}
          onAdd={addTodo}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}

// ── ListView ──────────────────────────────────────────────────────────────────
import { STAFF_LIST, STATUS_CONFIG, TAG_CONFIG } from '@/lib/types'

function ListView({
  todos,
  onUpdate,
  onDelete,
}: {
  todos: Todo[]
  onUpdate: (id: string, updates: Partial<Todo>) => void
  onDelete: (id: string) => void
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [commentMap, setCommentMap] = useState<Record<string, string>>({})

  const getComment = (t: Todo) => commentMap[t.id] ?? t.comment ?? ''

  const statuses: Status[] = ['overdue', 'todo', 'doing', 'done']

  return (
    <div className="p-4 space-y-6 pb-20">
      {statuses.map((status) => {
        const cfg = STATUS_CONFIG[status]
        const group = todos.filter((t) => t.status === status)
        if (group.length === 0) return null
        return (
          <div key={status}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.icon} {cfg.label}</span>
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400">{group.length}件</span>
            </div>
            <div className="space-y-2">
              {group.map((todo) => {
                const staff = STAFF_LIST.find((s) => s.id === todo.staff_id)
                const isOpen = expandedId === todo.id
                return (
                  <div key={todo.id} className={`bg-white border rounded-xl overflow-hidden transition-all ${todo.status === 'done' ? 'opacity-60' : ''}`}
                       style={{ borderColor: isOpen ? cfg.color : '#e2e8f0' }}>
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                      onClick={() => setExpandedId(isOpen ? null : todo.id)}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); onUpdate(todo.id, { status: todo.status === 'done' ? 'doing' : 'done' }) }}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          todo.status === 'done' ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 hover:border-green-400'
                        }`}
                      >
                        {todo.status === 'done' && <span className="text-[10px]">✓</span>}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${todo.status === 'done' ? 'line-through text-slate-400' : ''}`}>{todo.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {todo.tags.map((tag) => (
                            <span key={tag} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: TAG_CONFIG[tag].bg, color: TAG_CONFIG[tag].text }}>{tag}</span>
                          ))}
                          {todo.deadline && <span className={`text-[11px] ${todo.status === 'overdue' ? 'text-red-600 font-bold' : 'text-slate-400'}`}>📅 {todo.deadline}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {staff && (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: staff.color }}>
                            {staff.initial}
                          </div>
                        )}
                        <span className={`text-slate-400 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="card-details border-t border-slate-100 bg-slate-50 px-4 py-3 space-y-3">
                        {todo.detail && <p className="text-xs text-slate-600 leading-relaxed">{todo.detail}</p>}
                        {todo.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {todo.attachments.map((a) => (
                              <span key={a.id} className="text-[11px] bg-white border border-slate-200 rounded-full px-2.5 py-1">📄 {a.name}</span>
                            ))}
                          </div>
                        )}
                        <textarea
                          value={getComment(todo)}
                          onChange={(e) => setCommentMap((m) => ({ ...m, [todo.id]: e.target.value }))}
                          placeholder="対応メモ・コメントを入力..."
                          rows={2}
                          className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:border-teal-500 focus:outline-none resize-none bg-white"
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => onDelete(todo.id)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-500">削除</button>
                          <button onClick={() => onUpdate(todo.id, { comment: getComment(todo) })} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100">保存</button>
                          {todo.status !== 'done' && (
                            <button onClick={() => onUpdate(todo.id, { status: 'done' })} className="text-xs px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600">✓ 完了</button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

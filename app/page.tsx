'use client'
import { useState, useMemo, useCallback, useEffect } from 'react'
import type { Todo, Status } from '@/lib/types'
import { useStaff } from '@/lib/useStaff'
import {
  fetchTodos as fetchTodosFromDB,
  createTodo as createTodoDB,
  updateTodo as updateTodoDB,
  deleteTodo as deleteTodoDB,
} from '@/lib/supabase'
import Header from '@/components/Header'
import KanbanBoard from '@/components/KanbanBoard'
import ImportModal from '@/components/ImportModal'
import AddTodoModal from '@/components/AddTodoModal'
import Toast from '@/components/Toast'
import QrModal from '@/components/QrModal'
import TimelineView from '@/components/TimelineView'
import StaffMasterModal from '@/components/StaffMasterModal'

type View = 'kanban' | 'list' | 'timeline'

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStaffId, setSelectedStaffId] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<View>('kanban')
  const [showImport, setShowImport] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [showStaffMaster, setShowStaffMaster] = useState(false)
  const [addStatus, setAddStatus] = useState<Status | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null)

  // ── 担当者マスター ───────────────────────────────────────
  const { staffList, addStaff, updateStaff, deleteStaff, resolveStaffId } = useStaff()

  // ── Supabase からTODO初期ロード ─────────────────────────
  useEffect(() => {
    fetchTodosFromDB()
      .then((data) => setTodos(data))
      .catch(() => showToast('データの取得に失敗しました', 'error'))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── State helpers ──────────────────────────────────────────
  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type })
  }, [])

  const updateTodo = useCallback((id: string, updates: Partial<Todo>) => {
    // 楽観的 UI 更新
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t))
    if (updates.status === 'done') showToast('✅ 完了にしました')
    else if (updates.comment !== undefined) showToast('💬 メモを保存しました')
    // Supabase に同期
    updateTodoDB(id, updates).catch(() => showToast('保存に失敗しました', 'error'))
  }, [showToast])

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id))
    showToast('削除しました', 'info')
    deleteTodoDB(id).catch(() => showToast('削除に失敗しました', 'error'))
  }, [showToast])

  const addTodo = useCallback(async (todoData: Omit<Todo, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newTodo = await createTodoDB(todoData)
      setTodos((prev) => [newTodo, ...prev])
      showToast('📋 TODOを作成しました')
    } catch {
      showToast('作成に失敗しました', 'error')
    }
  }, [showToast])

  const importTodos = useCallback(async (newTodos: Partial<Todo>[]) => {
    const results: Todo[] = []
    for (const t of newTodos) {
      try {
        const created = await createTodoDB({
          link_no:     t.link_no,
          title:       t.title ?? '',
          detail:      t.detail,
          task:        t.task,
          staff_id:    t.staff_id ?? 'unknown',
          status:      t.status ?? 'todo',
          priority:    t.priority ?? '中',
          tags:        t.tags ?? [],
          deadline:    t.deadline,
          start_time:  t.start_time,
          end_time:    t.end_time,
          comment:     '',
          attachments: [],
        })
        results.push(created)
      } catch { /* スキップ */ }
    }
    setTodos((prev) => [...results, ...prev])
    showToast(`📥 ${results.length}件を取込みました`)
  }, [showToast])

  // ── Filtering ─────────────────────────────────────────────
  const filteredTodos = useMemo(() => {
    return todos.filter((t) => {
      const matchStaff = selectedStaffId === 'all' || t.staff_id === selectedStaffId
      const q = searchQuery.toLowerCase()
      const matchSearch = !q || t.title.toLowerCase().includes(q) || (t.link_no ?? '').includes(q) || (t.detail ?? '').toLowerCase().includes(q)
      return matchStaff && matchSearch
    })
  }, [todos, selectedStaffId, searchQuery])

  // ── Counts ────────────────────────────────────────────────
  const counts = useMemo(() => ({
    overdue: todos.filter((t) => t.status === 'overdue').length,
    todo:    todos.filter((t) => t.status === 'todo').length,
    doing:   todos.filter((t) => t.status === 'doing').length,
    done:    todos.filter((t) => t.status === 'done').length,
  }), [todos])

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <Header
        staffList={staffList}
        selectedStaffId={selectedStaffId}
        onStaffChange={setSelectedStaffId}
        onImportClick={() => setShowImport(true)}
        onAddClick={() => setAddStatus('todo')}
        onQrClick={() => setShowQr(true)}
        onStaffMaster={() => setShowStaffMaster(true)}
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

        {/* 件数バッジ */}
        <span className="text-xs text-slate-500 font-semibold">全 {todos.length} 件</span>

        {/* View toggle */}
        <div className="ml-auto flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
          {([
            { key: 'kanban',   label: 'カンバン' },
            { key: 'timeline', label: 'タイムライン' },
            { key: 'list',     label: 'リスト' },
          ] as { key: View; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${view === key ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'}`}
            >
              {label}
            </button>
          ))}
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

      {/* Board / Timeline / List */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full gap-3 text-slate-400">
            <span className="animate-spin text-2xl">⏳</span>
            <span className="text-sm font-medium">データを読み込んでいます...</span>
          </div>
        ) : view === 'kanban' ? (
          <KanbanBoard
            todos={filteredTodos}
            staffList={staffList}
            onUpdate={updateTodo}
            onDelete={deleteTodo}
            onAddClick={(s) => setAddStatus(s)}
          />
        ) : view === 'timeline' ? (
          <TimelineView todos={filteredTodos} onUpdate={updateTodo} onDelete={deleteTodo} />
        ) : (
          <ListView todos={filteredTodos} staffList={staffList} onUpdate={updateTodo} onDelete={deleteTodo} />
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
        <ImportModal
          onClose={() => setShowImport(false)}
          onImport={importTodos}
          resolveStaffId={resolveStaffId}
        />
      )}
      {showStaffMaster && (
        <StaffMasterModal
          staffList={staffList}
          onAdd={addStaff}
          onUpdate={updateStaff}
          onDelete={deleteStaff}
          onClose={() => setShowStaffMaster(false)}
        />
      )}
      {addStatus && (
        <AddTodoModal
          defaultStatus={addStatus}
          staffList={staffList}
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
import { STATUS_CONFIG, TAG_CONFIG } from '@/lib/types'
import type { Staff } from '@/lib/types'

function ListView({
  todos,
  staffList,
  onUpdate,
  onDelete,
}: {
  todos: Todo[]
  staffList: Staff[]
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
                const staff = staffList.find((s) => s.id === todo.staff_id)
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

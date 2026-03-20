'use client'
import { useState, useMemo, useCallback, useEffect } from 'react'
import type { Todo, Status, Priority, TagType, Staff } from '@/lib/types'
import { STATUS_CONFIG } from '@/lib/types'
import { useStaff } from '@/lib/useStaff'
import {
  fetchTodos as fetchTodosFromDB,
  createTodo as createTodoDB,
  updateTodo as updateTodoDB,
  deleteTodo as deleteTodoDB,
  deleteAllTodos as deleteAllTodosFromDB,
} from '@/lib/supabase'
import Header         from '@/components/Header'
import KanbanBoard    from '@/components/KanbanBoard'
import ImportModal    from '@/components/ImportModal'
import AddTodoModal   from '@/components/AddTodoModal'
import EditTodoModal  from '@/components/EditTodoModal'
import Toast          from '@/components/Toast'
import QrModal        from '@/components/QrModal'
import WeeklyCalendarView from '@/components/WeeklyCalendarView'
import StaffMasterModal from '@/components/StaffMasterModal'

type View = 'kanban' | 'weekly' | 'list'

// ── localStorage ヘルパー ────────────────────────────────────
const LS_KEY = 'todo_items'
function loadFromLS(): Todo[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') } catch { return [] }
}
function saveToLS(todos: Todo[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(LS_KEY, JSON.stringify(todos)) } catch {}
}

/** 期限が過ぎた未完了 TODO を overdue に自動変換 */
function applyOverdue(todos: Todo[]): Todo[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return todos.map((t) => {
    if ((t.status === 'todo' || t.status === 'doing') && t.deadline) {
      const dl = new Date(t.deadline.replace(/\//g, '-'))
      if (dl < today) return { ...t, status: 'overdue' as const }
    }
    return t
  })
}

export default function Home() {
  const [todos,         setTodos]         = useState<Todo[]>([])
  const [loading,       setLoading]       = useState(true)
  const [selectedStaffId, setSelectedStaffId] = useState('all')
  const [searchQuery,   setSearchQuery]   = useState('')
  const [view,          setView]          = useState<View>('kanban')
  const [showImport,    setShowImport]    = useState(false)
  const [showQr,        setShowQr]        = useState(false)
  const [showStaffMaster, setShowStaffMaster] = useState(false)
  const [addStatus,     setAddStatus]     = useState<Status | null>(null)
  const [editingTodo,   setEditingTodo]   = useState<Todo | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [filterMode, setFilterMode] = useState<'active' | 'range'>('active')
  const [dateFrom,   setDateFrom]   = useState('')
  const [dateTo,     setDateTo]     = useState('')

  // ── 担当者マスター ──────────────────────────────────────────
  const { staffList, addStaff, updateStaff, deleteStaff, resolveStaffId } = useStaff()

  // ── Toast helper ───────────────────────────────────────────
  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type })
  }, [])

  // ── 状態を更新して localStorage にも保存する共通関数 ────────
  // ※ applyOverdue は初回ロード時のみ適用。ユーザーが手動でステータスを
  //    変更した場合は上書きしない（期限超過でも「進行中」に戻せる）
  const persist = useCallback((updater: (prev: Todo[]) => Todo[]) => {
    setTodos((prev) => {
      const next = updater(prev)
      saveToLS(next)
      return next
    })
  }, [])

  // ── 初期ロード: LS → Supabase の順で読み込む ───────────────
  useEffect(() => {
    // 1. localStorage から即時表示
    const lsData = loadFromLS()
    if (lsData.length > 0) {
      setTodos(applyOverdue(lsData))
      setLoading(false)
    }

    // 2. Supabase と同期（成功すれば LS を上書き）
    fetchTodosFromDB()
      .then((data) => {
        const processed = applyOverdue(data)
        setTodos(processed)
        saveToLS(processed)
      })
      .catch(() => {
        // Supabase 未接続でも LS データで動作継続
        if (lsData.length === 0) showToast('オフラインモードで動作中', 'info')
      })
      .finally(() => setLoading(false))
  }, [showToast])

  // ── 期限超過の自動チェック（1分ごと） ──────────────────────
  // ページを開いたまま日付が変わっても todo/doing → overdue に自動更新
  useEffect(() => {
    const check = () => {
      setTodos((prev) => {
        const next = applyOverdue(prev)
        const changed = next.some((t, i) => t.status !== prev[i].status)
        if (changed) {
          saveToLS(next)
          return next
        }
        return prev
      })
    }
    // 1分ごとにチェック
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [])

  // ── CRUD ──────────────────────────────────────────────────

  const updateTodo = useCallback((id: string, updates: Partial<Todo>) => {
    persist((prev) => prev.map((t) => t.id === id ? { ...t, ...updates } : t))
    if (updates.status === 'done')         showToast('✅ 完了にしました')
    else if (updates.comment !== undefined) showToast('💬 メモを保存しました')
    else                                    showToast('更新しました')
    // DB バックグラウンド同期（失敗しても LS には保存済み）
    updateTodoDB(id, updates).catch(() => {})
  }, [persist, showToast])

  const deleteTodo = useCallback((id: string) => {
    persist((prev) => prev.filter((t) => t.id !== id))
    showToast('削除しました', 'info')
    deleteTodoDB(id).catch(() => {})
  }, [persist, showToast])

  const addTodo = useCallback(async (todoData: Omit<Todo, 'id' | 'created_at' | 'updated_at'>) => {
    // 楽観的追加（DB 結果を待たずに即時表示）
    const tempId = `temp_${Date.now()}`
    const optimistic: Todo = {
      ...todoData, id: tempId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    persist((prev) => [optimistic, ...prev])
    showToast('📋 TODOを作成しました')

    // DB に保存してから ID を正規 UUID に差し替え
    try {
      const saved = await createTodoDB(todoData)
      persist((prev) => prev.map((t) => t.id === tempId ? saved : t))
    } catch { /* LS の tempId のまま保持 */ }
  }, [persist, showToast])

  const importTodos = useCallback(async (newTodos: Partial<Todo>[]) => {
    if (newTodos.length === 0) return

    // 楽観的追加（全件を即時画面反映）
    const tempItems: Todo[] = newTodos.map((t) => ({
      id:          `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      link_no:     t.link_no,
      title:       t.title ?? '',
      detail:      t.detail,
      task:        t.task,
      staff_id:    t.staff_id ?? 'unknown',
      status:      (t.status ?? 'todo') as Status,
      priority:    (t.priority ?? '中') as Priority,
      tags:        (t.tags ?? []) as TagType[],
      deadline:    t.deadline,
      start_time:  t.start_time,
      end_time:    t.end_time,
      comment:     '',
      attachments: [],
      created_at:  new Date().toISOString(),
      updated_at:  new Date().toISOString(),
    }))

    persist((prev) => [...tempItems, ...prev])
    showToast(`📥 ${tempItems.length}件を取込みました`)

    // DB への保存はバックグラウンドで実行
    for (let i = 0; i < tempItems.length; i++) {
      const temp = tempItems[i]
      const t    = newTodos[i]
      try {
        const saved = await createTodoDB({
          link_no: t.link_no, title: t.title ?? '',
          detail: t.detail, task: t.task,
          staff_id: t.staff_id ?? 'unknown',
          status: t.status ?? 'todo', priority: t.priority ?? '中',
          tags: t.tags ?? [], deadline: t.deadline,
          start_time: t.start_time, end_time: t.end_time,
          comment: '', attachments: [],
        })
        // temp ID → 正規 UUID に差し替え
        persist((prev) => prev.map((x) => x.id === temp.id ? saved : x))
      } catch { /* LS の tempId のまま保持 */ }
    }
  }, [persist, showToast])

  // ── 全件削除（テスト用） ────────────────────────────────────
  const deleteAllTodos = useCallback(async () => {
    if (!confirm(`全 ${todos.length} 件のTODOを削除します。\nこの操作は元に戻せません。よろしいですか？`)) return
    persist(() => [])
    showToast('全件削除しました', 'info')
    deleteAllTodosFromDB().catch(() => {})
  }, [todos.length, persist, showToast])

  // ── Edit handler ──────────────────────────────────────────
  const handleEdit = useCallback((id: string) => {
    const t = todos.find((x) => x.id === id)
    if (t) setEditingTodo(t)
  }, [todos])

  // ── Filtering ─────────────────────────────────────────────
  const filteredTodos = useMemo(() => {
    return todos.filter((t) => {
      const matchStaff  = selectedStaffId === 'all' || t.staff_id === selectedStaffId
      const q           = searchQuery.toLowerCase().replace(/^#/, '')
      const matchSearch = !q
        || t.title.toLowerCase().includes(q)
        || (t.link_no ?? '').includes(q)
        || (t.detail ?? '').toLowerCase().includes(q)
        || (t.task ?? '').toLowerCase().includes(q)

      if (filterMode === 'active') {
        // ① 完了・キャンセル以外（期間指定なし）
        return matchStaff && matchSearch && t.status !== 'done' && t.status !== 'cancelled'
      } else {
        // ② 期間指定・全ステータス
        let matchDate = true
        if (t.deadline) {
          const dl = t.deadline.replace(/\//g, '-') // YYYY-MM-DD
          if (dateFrom && dl < dateFrom) matchDate = false
          if (dateTo   && dl > dateTo)   matchDate = false
        }
        return matchStaff && matchSearch && matchDate
      }
    })
  }, [todos, selectedStaffId, searchQuery, filterMode, dateFrom, dateTo])

  // 週間ビュー用: 担当者・検索のみ適用（ステータスフィルター除外）
  // カレンダーは完了済みも含め週内の全TODOを表示する
  const weeklyTodos = useMemo(() => {
    return todos.filter((t) => {
      const matchStaff  = selectedStaffId === 'all' || t.staff_id === selectedStaffId
      const q           = searchQuery.toLowerCase().replace(/^#/, '')
      const matchSearch = !q
        || t.title.toLowerCase().includes(q)
        || (t.link_no ?? '').includes(q)
        || (t.detail ?? '').toLowerCase().includes(q)
        || (t.task ?? '').toLowerCase().includes(q)
      return matchStaff && matchSearch
    })
  }, [todos, selectedStaffId, searchQuery])

  // ── Counts ────────────────────────────────────────────────
  const counts = useMemo(() => ({
    overdue:   filteredTodos.filter((t) => t.status === 'overdue').length,
    todo:      filteredTodos.filter((t) => t.status === 'todo').length,
    doing:     filteredTodos.filter((t) => t.status === 'doing').length,
    done:      filteredTodos.filter((t) => t.status === 'done').length,
    cancelled: todos.filter((t) => t.status === 'cancelled').length,
  }), [filteredTodos, todos])

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
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
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

          {/* フィルターモード切替 */}
          <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setFilterMode('active')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${filterMode === 'active' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'}`}
            >
              ① 完了以外
            </button>
            <button
              onClick={() => setFilterMode('range')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${filterMode === 'range' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}
            >
              ② 期間指定
            </button>
          </div>

          {/* 件数バッジ */}
          <span className="text-xs text-slate-500 font-semibold">
            {filteredTodos.length} 件表示
          </span>

          {/* 全件削除（テスト用） */}
          {todos.length > 0 && (
            <button
              onClick={deleteAllTodos}
              className="text-xs px-2.5 py-1 border border-red-200 text-red-400 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-400 transition-all"
            >
              🗑 全件削除
            </button>
          )}

          {/* View toggle */}
          <div className="ml-auto flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
            {([
              { key: 'kanban', label: 'カンバン' },
              { key: 'weekly', label: '週間' },
              { key: 'list',   label: 'リスト' },
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

        {/* ② 期間指定: 日付入力 */}
        {filterMode === 'range' && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="text-blue-600 font-semibold">📅 期間：</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1 text-xs focus:border-blue-400 focus:outline-none bg-slate-50"
            />
            <span className="text-slate-400">〜</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1 text-xs focus:border-blue-400 focus:outline-none bg-slate-50"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo('') }}
                className="text-slate-400 hover:text-slate-600 text-xs px-1.5 py-0.5 rounded hover:bg-slate-100"
              >
                クリア
              </button>
            )}
            <span className="text-slate-400 ml-1">（全ステータス表示）</span>
          </div>
        )}
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
            onEdit={handleEdit}
            onAddClick={(s) => setAddStatus(s)}
          />
        ) : view === 'weekly' ? (
          <WeeklyCalendarView
            todos={weeklyTodos}
            staffList={staffList}
            onUpdate={updateTodo}
            onDelete={deleteTodo}
            onEdit={handleEdit}
          />
        ) : (
          <ListView
            todos={filteredTodos}
            staffList={staffList}
            onUpdate={updateTodo}
            onDelete={deleteTodo}
            onEdit={handleEdit}
          />
        )}
      </div>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-14 flex z-40">
        {[
          { icon: '📋', label: 'カンバン', action: () => setView('kanban') },
          { icon: '📅', label: '週間',     action: () => setView('weekly') },
          { icon: '📊', label: 'リスト',   action: () => setView('list') },
          { icon: '⚙️', label: '設定',         action: () => setShowStaffMaster(true) },
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
      {editingTodo && (
        <EditTodoModal
          todo={editingTodo}
          staffList={staffList}
          onClose={() => setEditingTodo(null)}
          onSave={(id, updates) => {
            updateTodo(id, updates)
            setEditingTodo(null)
          }}
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

function ListView({
  todos,
  staffList,
  onUpdate,
  onDelete,
  onEdit,
}: {
  todos: Todo[]
  staffList: Staff[]
  onUpdate: (id: string, updates: Partial<Todo>) => void
  onDelete: (id: string) => void
  onEdit:   (id: string) => void
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [commentMap, setCommentMap] = useState<Record<string, string>>({})

  const getComment = (t: Todo) => commentMap[t.id] ?? t.comment ?? ''

  // 期限日昇順ソート（期限なしは末尾）
  const sorted = [...todos].sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0
    if (!a.deadline) return 1
    if (!b.deadline) return -1
    return a.deadline.localeCompare(b.deadline)
  })

  const STATUS_BADGE_LIST: Record<string, { label: string; cls: string }> = {
    overdue:   { label: '期限超過',   cls: 'bg-red-100 text-red-600' },
    todo:      { label: '未着手',     cls: 'bg-amber-100 text-amber-600' },
    doing:     { label: '進行中',     cls: 'bg-blue-100 text-blue-600' },
    done:      { label: '完了',       cls: 'bg-green-100 text-green-600' },
    cancelled: { label: 'キャンセル', cls: 'bg-slate-100 text-slate-500' },
  }

  return (
    <div className="p-3 space-y-1.5 pb-20">
      {sorted.map((todo) => {
        const staff  = staffList.find((s) => s.id === todo.staff_id)
        const isOpen = expandedId === todo.id
        const cfg    = STATUS_CONFIG[todo.status]
        const badge  = STATUS_BADGE_LIST[todo.status]
        const isDone = todo.status === 'done'
        return (
          <div
            key={todo.id}
            className={`bg-white border rounded-xl overflow-hidden transition-all ${isDone ? 'opacity-60' : ''}`}
            style={{ borderColor: isOpen ? cfg.color : '#e2e8f0' }}
          >
            <div
              className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
              onClick={() => setExpandedId(isOpen ? null : todo.id)}
            >
              {/* 完了トグル */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onUpdate(todo.id, { status: isDone ? 'doing' : 'done' })
                }}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  isDone ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 hover:border-green-400'
                }`}
              >
                {isDone && <span className="text-[10px]">✓</span>}
              </button>

              {/* メイン情報 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {todo.link_no && (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">#{todo.link_no}</span>
                  )}
                  {badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badge.cls}`}>{badge.label}</span>
                  )}
                  <p className={`text-sm font-semibold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {todo.title}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {todo.deadline && (
                    <span className={`text-[11px] font-medium ${todo.status === 'overdue' ? 'text-red-600' : 'text-slate-400'}`}>
                      📅 {todo.deadline}
                    </span>
                  )}
                  {(todo.start_time || todo.end_time) && (
                    <span className="text-[11px] text-slate-400">
                      🕐 {todo.start_time}{todo.end_time ? `〜${todo.end_time}` : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* 担当者 */}
              <div className="flex items-center gap-2 shrink-0">
                {staff && (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: staff.color }}
                    title={staff.name}
                  >
                    {staff.initial}
                  </div>
                )}
                <span className={`text-slate-400 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
              </div>
            </div>

            {/* 展開詳細 */}
            {isOpen && (
              <div className="card-details border-t border-slate-100 bg-slate-50 px-4 py-3 space-y-3">
                {todo.detail && <p className="text-xs text-slate-600 leading-relaxed">{todo.detail}</p>}
                {todo.task && (
                  <p className="text-xs text-slate-500 bg-white rounded-lg px-3 py-2 border border-slate-200">
                    📝 {todo.task}
                  </p>
                )}
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
                  <button
                    onClick={() => { if (confirm(`「${todo.title}」を削除しますか？`)) onDelete(todo.id) }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-500"
                  >削除</button>
                  <button
                    onClick={() => onEdit(todo.id)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-500 hover:bg-blue-50"
                  >✏ 編集</button>
                  <button
                    onClick={() => onUpdate(todo.id, { comment: getComment(todo) })}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                  >保存</button>
                  {!isDone && (
                    <button
                      onClick={() => onUpdate(todo.id, { status: 'done' })}
                      className="text-xs px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600"
                    >✓ 完了</button>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
      {sorted.length === 0 && (
        <div className="text-center py-20 text-slate-400 text-sm">該当するTODOはありません</div>
      )}
    </div>
  )
}

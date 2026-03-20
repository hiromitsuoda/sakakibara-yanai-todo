'use client'
import { useState } from 'react'
import type { Todo, Staff } from '@/lib/types'

interface Props {
  todos: Todo[]
  staffList: Staff[]
  onUpdate: (id: string, updates: Partial<Todo>) => void
  onDelete: (id: string) => void
  onEdit:   (id: string) => void
}

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

function getWeekStart(base: Date): Date {
  const d = new Date(base)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0=日
  const diff = day === 0 ? -6 : 1 - day // 月曜始まり
  d.setDate(d.getDate() + diff)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

/** Date → "YYYY/MM/DD" */
function toSlash(date: Date): string {
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
}

const STATUS_BAR: Record<string, string> = {
  overdue:   'border-red-400',
  todo:      'border-amber-400',
  doing:     'border-blue-400',
  done:      'border-green-400',
  cancelled: 'border-slate-300',
}
const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  overdue:   { label: '期限超過',   cls: 'bg-red-100 text-red-600' },
  todo:      { label: '未着手',     cls: 'bg-amber-100 text-amber-600' },
  doing:     { label: '進行中',     cls: 'bg-blue-100 text-blue-600' },
  done:      { label: '完了',       cls: 'bg-green-100 text-green-600' },
  cancelled: { label: 'キャンセル', cls: 'bg-slate-100 text-slate-500' },
}
const PRIORITY_DOT: Record<string, string> = {
  高: 'bg-red-500',
  中: 'bg-amber-400',
  低: 'bg-green-500',
}

export default function WeeklyCalendarView({ todos, staffList, onUpdate, onDelete, onEdit }: Props) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // deadline が今週内の todos をグルーピング
  const byDate = new Map<string, Todo[]>()
  days.forEach((d) => byDate.set(toSlash(d), []))

  const outOfRange: Todo[] = []
  todos.forEach((t) => {
    const key = t.deadline ?? ''
    if (byDate.has(key)) {
      byDate.get(key)!.push(t)
    } else {
      outOfRange.push(t)
    }
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weekEnd   = addDays(weekStart, 6)
  const monthLabel =
    weekStart.getMonth() === weekEnd.getMonth()
      ? `${weekStart.getFullYear()}年${weekStart.getMonth() + 1}月`
      : `${weekStart.getFullYear()}年${weekStart.getMonth() + 1}月〜${weekEnd.getMonth() + 1}月`

  const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()} 〜 ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`

  const totalInWeek = days.reduce((s, d) => s + (byDate.get(toSlash(d))?.length ?? 0), 0)

  return (
    <div className="flex flex-col h-full bg-slate-50">

      {/* ── ナビゲーションバー ── */}
      <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-slate-200 shrink-0">
        <button
          onClick={() => setWeekStart((w) => addDays(w, -7))}
          className="px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
        >
          ← 前週
        </button>

        <div className="flex flex-col items-center mx-1 leading-tight">
          <span className="text-[10px] text-slate-400">{monthLabel}</span>
          <span className="text-sm font-bold text-slate-700">{weekLabel}</span>
        </div>

        <button
          onClick={() => setWeekStart((w) => addDays(w, 7))}
          className="px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
        >
          次週 →
        </button>

        <button
          onClick={() => setWeekStart(getWeekStart(new Date()))}
          className="px-2.5 py-1.5 text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-100 transition-all"
        >
          今週
        </button>

        <span className="ml-auto text-[11px] text-slate-400">今週 {totalInWeek} 件</span>
      </div>

      {/* ── カレンダーグリッド ── */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7 h-full" style={{ minHeight: '400px' }}>
          {days.map((day) => {
            const key      = toSlash(day)
            const dayTodos = byDate.get(key) ?? []
            const dow      = day.getDay()
            const isToday  = day.getTime() === today.getTime()
            const isSun    = dow === 0
            const isSat    = dow === 6

            return (
              <div
                key={key}
                className={`border-r border-slate-200 flex flex-col ${
                  isSun ? 'bg-red-50/40' : isSat ? 'bg-blue-50/40' : 'bg-white'
                } last:border-r-0`}
              >
                {/* 日付ヘッダー */}
                <div
                  className={`sticky top-0 z-10 px-1.5 py-1 border-b text-center shrink-0 ${
                    isToday
                      ? 'bg-teal-500 border-teal-400'
                      : isSun
                      ? 'bg-red-50 border-slate-200'
                      : isSat
                      ? 'bg-blue-50 border-slate-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <p className={`text-[11px] font-bold ${
                    isToday ? 'text-white' :
                    isSun ? 'text-red-500' :
                    isSat ? 'text-blue-500' : 'text-slate-500'
                  }`}>
                    {DAY_LABELS[dow]}
                  </p>
                  <p className={`text-base font-black leading-none ${isToday ? 'text-white' : 'text-slate-800'}`}>
                    {day.getDate()}
                  </p>
                  {dayTodos.length > 0 && (
                    <span className={`text-[9px] font-semibold ${isToday ? 'text-teal-100' : 'text-slate-400'}`}>
                      {dayTodos.length}件
                    </span>
                  )}
                </div>

                {/* TODOカード */}
                <div className="flex-1 p-1 space-y-1 overflow-y-auto">
                  {dayTodos.map((todo) => {
                    const staff = staffList.find((s) => s.id === todo.staff_id)
                    const bar   = STATUS_BAR[todo.status] ?? 'border-slate-300'
                    const isDone = todo.status === 'done'

                    return (
                      <div
                        key={todo.id}
                        onClick={() => onEdit(todo.id)}
                        className={`border-l-2 ${bar} rounded-r-lg px-1.5 py-1 cursor-pointer hover:shadow-sm transition-all ${
                          isDone ? 'bg-slate-50 opacity-60' :
                          todo.status === 'overdue' ? 'bg-red-50' : 'bg-white'
                        } shadow-sm`}
                      >
                        {/* 上段: ステータスバッジ + 優先度ドット */}
                        <div className="flex items-center gap-1 mb-0.5">
                          {todo.link_no && (
                            <span className="text-[9px] text-slate-400 font-bold leading-none">#{todo.link_no}</span>
                          )}
                          {(() => {
                            const badge = STATUS_BADGE[todo.status]
                            return badge ? (
                              <span className={`text-[8px] font-bold px-1 py-0.5 rounded leading-none ${badge.cls}`}>
                                {badge.label}
                              </span>
                            ) : null
                          })()}
                          <span className={`ml-auto w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[todo.priority] ?? 'bg-slate-300'}`} />
                        </div>

                        {/* タイトル */}
                        <p className={`text-[10px] font-semibold leading-snug text-slate-700 line-clamp-3 ${isDone ? 'line-through text-slate-400' : ''}`}>
                          {todo.title}
                        </p>

                        {/* 時間 */}
                        {(todo.start_time || todo.end_time) && (
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            🕐 {todo.start_time}{todo.end_time ? `〜${todo.end_time}` : ''}
                          </p>
                        )}

                        {/* 担当者アバター */}
                        {staff && (
                          <div className="flex items-center gap-1 mt-1">
                            <div
                              className="w-3.5 h-3.5 rounded-full text-white text-[8px] font-bold flex items-center justify-center shrink-0"
                              style={{ background: staff.color }}
                              title={staff.name}
                            >
                              {staff.initial}
                            </div>
                            <span className="text-[9px] text-slate-400 truncate">{staff.name}</span>
                          </div>
                        )}

                        {/* 完了ボタン */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onUpdate(todo.id, { status: isDone ? 'todo' : 'done' })
                          }}
                          className={`mt-1 w-full py-0.5 rounded text-[9px] font-semibold transition-all ${
                            isDone
                              ? 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {isDone ? '↩ 戻す' : '✓ 完了'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 期限未設定 / 今週外 ── */}
      {outOfRange.length > 0 && (
        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-2">
          <p className="text-[10px] font-bold text-slate-400 mb-1.5">今週外・期限未設定 ({outOfRange.length}件)</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {outOfRange.map((todo) => {
              const staff = staffList.find((s) => s.id === todo.staff_id)
              return (
                <div
                  key={todo.id}
                  onClick={() => onEdit(todo.id)}
                  className="shrink-0 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 cursor-pointer hover:shadow-sm transition-all min-w-[120px] max-w-[160px]"
                >
                  {todo.deadline && (
                    <p className="text-[9px] text-slate-400 mb-0.5">📅 {todo.deadline}</p>
                  )}
                  <p className="text-[10px] font-semibold text-slate-700 line-clamp-2">{todo.title}</p>
                  {staff && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-3 h-3 rounded-full text-white text-[7px] flex items-center justify-center" style={{ background: staff.color }}>
                        {staff.initial}
                      </div>
                      <span className="text-[9px] text-slate-400">{staff.name}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

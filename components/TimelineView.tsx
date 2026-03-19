'use client'
import { useState } from 'react'
import type { Todo, Staff } from '@/lib/types'
import { STATUS_CONFIG } from '@/lib/types'

interface Props {
  todos: Todo[]
  staffList: Staff[]
  onUpdate: (id: string, updates: Partial<Todo>) => void
  onDelete: (id: string) => void
  onEdit:   (id: string) => void
}

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

function parseDeadline(d: string | undefined): Date | null {
  if (!d) return null
  const parts = d.replace(/\//g, '-').split('-')
  if (parts.length < 3) return null
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
}

function getDayLabel(date: Date | null): string {
  if (!date) return '期限未設定'
  const diff = Math.round((date.getTime() - TODAY.getTime()) / 86400000)
  if (diff < 0) return '期限超過'
  if (diff === 0) return '今日'
  if (diff === 1) return '明日'
  if (diff <= 7) return '今週'
  if (diff <= 14) return '来週'
  return 'それ以降'
}

const GROUP_ORDER = ['期限超過', '今日', '明日', '今週', '来週', 'それ以降', '期限未設定', '完了']
const GROUP_STYLE: Record<string, { color: string; bg: string; dot: string }> = {
  '期限超過':   { color: 'text-red-700',    bg: 'bg-red-50',    dot: 'bg-red-500' },
  '今日':       { color: 'text-orange-700', bg: 'bg-orange-50', dot: 'bg-orange-500' },
  '明日':       { color: 'text-amber-700',  bg: 'bg-amber-50',  dot: 'bg-amber-400' },
  '今週':       { color: 'text-teal-700',   bg: 'bg-teal-50',   dot: 'bg-teal-500' },
  '来週':       { color: 'text-blue-700',   bg: 'bg-blue-50',   dot: 'bg-blue-400' },
  'それ以降':   { color: 'text-slate-600',  bg: 'bg-slate-50',  dot: 'bg-slate-400' },
  '期限未設定': { color: 'text-slate-500',  bg: 'bg-slate-50',  dot: 'bg-slate-300' },
  '完了':       { color: 'text-green-700',  bg: 'bg-green-50',  dot: 'bg-green-500' },
}

export default function TimelineView({ todos, staffList, onUpdate, onDelete, onEdit }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [commentMap, setCommentMap] = useState<Record<string, string>>({})

  const sorted = [...todos].sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1
    if (b.status === 'done' && a.status !== 'done') return -1
    const da = parseDeadline(a.deadline)
    const db = parseDeadline(b.deadline)
    if (!da && !db) return 0
    if (!da) return 1
    if (!db) return -1
    return da.getTime() - db.getTime()
  })

  const groups: Record<string, Todo[]> = {}
  for (const t of sorted) {
    const key = t.status === 'done' ? '完了' : getDayLabel(parseDeadline(t.deadline))
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  }

  const orderedKeys = GROUP_ORDER.filter((g) => groups[g]?.length)

  return (
    <div className="p-4 pb-20 space-y-6 max-w-2xl mx-auto">
      {orderedKeys.map((groupKey) => {
        const style = GROUP_STYLE[groupKey] ?? GROUP_STYLE['それ以降']
        const items = groups[groupKey]
        return (
          <div key={groupKey}>
            {/* Group header */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-3 h-3 rounded-full ${style.dot} shrink-0`} />
              <span className={`text-xs font-bold ${style.color}`}>{groupKey}</span>
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[10px] text-slate-400">{items.length}件</span>
            </div>

            {/* Timeline items */}
            <div className="relative ml-1.5">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200" />
              <div className="space-y-2 ml-5">
                {items.map((todo) => {
                  const staff     = staffList.find((s) => s.id === todo.staff_id)
                  const statusCfg = STATUS_CONFIG[todo.status]
                  const isOpen    = expandedId === todo.id
                  const comment   = commentMap[todo.id] ?? todo.comment ?? ''

                  return (
                    <div key={todo.id} className="relative">
                      {/* timeline dot */}
                      <div
                        className="absolute -left-[22px] top-3 w-2.5 h-2.5 rounded-full border-2 border-white z-10"
                        style={{ background: todo.status === 'done' ? '#22c55e' : statusCfg.color }}
                      />

                      <div className={`bg-white border rounded-xl overflow-hidden transition-all ${
                        todo.status === 'done' ? 'opacity-60' : ''
                      } ${isOpen ? 'border-teal-300 shadow-md' : 'border-slate-200 hover:border-teal-200'}`}>
                        {/* Status bar */}
                        <div className="h-0.5 w-full" style={{ background: statusCfg.color }} />

                        {/* Card header */}
                        <div
                          className="flex items-start gap-3 px-4 py-3 cursor-pointer"
                          onClick={() => setExpandedId(isOpen ? null : todo.id)}
                        >
                          {/* Check button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onUpdate(todo.id, { status: todo.status === 'done' ? 'doing' : 'done' })
                            }}
                            className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              todo.status === 'done'
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-slate-300 hover:border-green-400'
                            }`}
                          >
                            {todo.status === 'done' && <span className="text-[10px]">✓</span>}
                          </button>

                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold leading-snug ${
                              todo.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}>
                              {todo.link_no && (
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded mr-1.5">
                                  #{todo.link_no}
                                </span>
                              )}
                              {todo.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {todo.deadline && (
                                <span className={`text-[11px] font-medium ${
                                  todo.status === 'overdue' ? 'text-red-600' :
                                  todo.status === 'done'    ? 'text-green-600' : 'text-slate-500'
                                }`}>
                                  📅 {todo.deadline}
                                </span>
                              )}
                              {staff && (
                                <div className="flex items-center gap-1">
                                  <div
                                    className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                                    style={{ background: staff.color }}
                                  >
                                    {staff.initial}
                                  </div>
                                  <span className="text-[11px] text-slate-500">{staff.name}</span>
                                </div>
                              )}
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                todo.priority === '高' ? 'bg-red-50 text-red-600' :
                                todo.priority === '中' ? 'bg-amber-50 text-amber-600' :
                                'bg-green-50 text-green-600'
                              }`}>{todo.priority}</span>
                              {todo.attachments.some((a) => a.name.includes('見積')) && (
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">📄 見積書</span>
                              )}
                              {todo.comment && <span className="text-slate-400 text-[11px]">💬</span>}
                            </div>
                          </div>

                          <span className={`text-slate-400 text-xs mt-1 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                        </div>

                        {/* Expanded detail */}
                        {isOpen && (
                          <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                            {todo.detail && (
                              <p className="text-xs text-slate-600 leading-relaxed">{todo.detail}</p>
                            )}
                            {todo.task && (
                              <p className="text-xs text-slate-500 bg-white rounded-lg px-3 py-2 border border-slate-200">
                                📝 {todo.task}
                              </p>
                            )}
                            {(todo.start_time || todo.end_time) && (
                              <p className="text-xs text-slate-500">🕐 {todo.start_time} 〜 {todo.end_time}</p>
                            )}
                            {todo.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {todo.attachments.map((a) => (
                                  <span key={a.id} className="text-[11px] bg-white border border-slate-200 rounded-full px-2.5 py-1">
                                    {a.type === 'pdf' ? '📄' : '📊'} {a.name}
                                  </span>
                                ))}
                              </div>
                            )}
                            <textarea
                              value={comment}
                              onChange={(e) => setCommentMap((m) => ({ ...m, [todo.id]: e.target.value }))}
                              placeholder="対応メモ・コメントを入力..."
                              rows={2}
                              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:border-teal-500 focus:outline-none resize-none bg-white"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => { if (confirm(`「${todo.title}」を削除しますか？`)) onDelete(todo.id) }}
                                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-500"
                              >
                                削除
                              </button>
                              <button
                                onClick={() => onEdit(todo.id)}
                                className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-500 hover:bg-blue-50"
                              >
                                ✏ 編集
                              </button>
                              <button
                                onClick={() => onUpdate(todo.id, { comment })}
                                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                              >
                                保存
                              </button>
                              {todo.status !== 'done' && (
                                <button
                                  onClick={() => onUpdate(todo.id, { status: 'done' })}
                                  className="text-xs px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600"
                                >
                                  ✓ 完了
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
      {orderedKeys.length === 0 && (
        <div className="text-center py-20 text-slate-400 text-sm">該当するTODOはありません</div>
      )}
    </div>
  )
}

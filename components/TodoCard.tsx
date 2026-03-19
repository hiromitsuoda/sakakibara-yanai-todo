'use client'
import { useState } from 'react'
import type { Todo, Status, Staff } from '@/lib/types'
import { STATUS_CONFIG, TAG_CONFIG } from '@/lib/types'

interface Props {
  todo: Todo
  staffList: Staff[]
  onUpdate: (id: string, updates: Partial<Todo>) => void
  onDelete: (id: string) => void
  onEdit:   (id: string) => void
}

const STATUS_NEXT: Record<Status, { label: string; next: Status } | null> = {
  overdue: { label: '未着手へ', next: 'todo' },
  todo:    { label: '進行中へ', next: 'doing' },
  doing:   { label: '完了にする', next: 'done' },
  done:    null,
}

export default function TodoCard({ todo, staffList, onUpdate, onDelete, onEdit }: Props) {
  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState(todo.comment ?? '')
  const [saving, setSaving] = useState(false)

  const staff = staffList.find((s) => s.id === todo.staff_id)
  const isDone = todo.status === 'done'
  const isOverdue = todo.status === 'overdue'
  const nextAction = STATUS_NEXT[todo.status]

  const handleSaveComment = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 400)) // mock API delay
    onUpdate(todo.id, { comment })
    setSaving(false)
  }

  const handleMoveStatus = () => {
    if (!nextAction) return
    onUpdate(todo.id, { status: nextAction.next })
  }

  const handleComplete = () => {
    onUpdate(todo.id, { status: 'done' })
  }

  return (
    <div
      className={`kanban-card bg-white rounded-xl border overflow-hidden cursor-pointer select-none
        ${isDone ? 'opacity-60' : ''}
        ${isOverdue ? 'border-red-200' : 'border-slate-200'}
        ${open ? 'shadow-lg' : 'shadow-sm hover:border-teal-300'}
      `}
    >
      {/* Card header */}
      <div
        className="p-3"
        onClick={() => setOpen(!open)}
      >
        {/* ID & Staff row */}
        <div className="flex items-center gap-2 mb-2">
          {todo.link_no && (
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              #{todo.link_no}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            <PriorityBadge priority={todo.priority} />
            {staff && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ background: staff.color }}
                title={staff.name}
              >
                {staff.initial}
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <p className={`text-sm font-semibold leading-snug mb-2 ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
          {todo.title}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-2">
          {todo.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: TAG_CONFIG[tag].bg, color: TAG_CONFIG[tag].text }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 text-[11px]">
          {todo.deadline && (
            <span className={`font-medium ${isOverdue ? 'text-red-600' : isDone ? 'text-green-600' : 'text-slate-500'}`}>
              {isOverdue ? '⚠ ' : isDone ? '✓ ' : '📅 '}
              {todo.deadline}
            </span>
          )}
          <EstimateButton attachments={todo.attachments} />
          {todo.attachments.length > 0 && (
            <span className="text-slate-400">📎 {todo.attachments.length}</span>
          )}
          {todo.comment && (
            <span className="text-slate-400">💬</span>
          )}
          <span className={`ml-auto transition-transform duration-200 text-slate-400 ${open ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </div>
      </div>

      {/* Expandable detail */}
      {open && (
        <div className="card-details border-t border-slate-100 bg-slate-50 p-3 space-y-3" onClick={(e) => e.stopPropagation()}>

          {/* Detail text */}
          {todo.detail && (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">案件詳細</label>
              <p className="text-xs text-slate-600 leading-relaxed">{todo.detail}</p>
            </div>
          )}

          {/* Time & Staff */}
          <div className="grid grid-cols-2 gap-2">
            {(todo.start_time || todo.end_time) && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">作業時間</label>
                <p className="text-xs text-slate-600">{todo.start_time} 〜 {todo.end_time}</p>
              </div>
            )}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">担当者</label>
              <div className="flex items-center gap-1.5">
                {staff && (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ background: staff.color }}
                  >
                    {staff.initial}
                  </div>
                )}
                <p className="text-xs text-slate-600">{staff?.name}</p>
              </div>
            </div>
          </div>

          {/* Attachments */}
          {todo.attachments.length > 0 && (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">添付ファイル</label>
              <div className="flex flex-wrap gap-1.5">
                {todo.attachments.map((att) => (
                  <button
                    key={att.id}
                    className="flex items-center gap-1.5 text-[11px] bg-white border border-slate-200 rounded-full px-2.5 py-1 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50 transition-all"
                  >
                    <span>{att.type === 'pdf' ? '📄' : att.type === 'xlsx' ? '📊' : '📝'}</span>
                    {att.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Comment textarea */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              対応メモ・コメント
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="対応内容・確認事項・次のアクションを入力..."
              rows={3}
              className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 resize-none focus:border-teal-500 focus:outline-none placeholder-slate-400 leading-relaxed"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 justify-between">
            <div className="flex gap-1.5">
              <button
                onClick={() => { if (confirm(`「${todo.title}」を削除しますか？`)) onDelete(todo.id) }}
                className="text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500 transition-all"
              >
                削除
              </button>
              <button
                onClick={() => { onEdit(todo.id) }}
                className="text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 text-blue-500 hover:bg-blue-50 hover:border-blue-300 transition-all"
              >
                ✏ 編集
              </button>
              <button
                onClick={handleSaveComment}
                disabled={saving}
                className="text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all"
              >
                {saving ? '保存中...' : 'メモ保存'}
              </button>
            </div>
            <div className="flex gap-1.5">
              {!isDone && nextAction && (
                <button
                  onClick={handleMoveStatus}
                  className={`text-[11px] px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    nextAction.next === 'done'
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                  }`}
                >
                  {nextAction.next === 'done' ? '✓ ' : '→ '}
                  {nextAction.label}
                </button>
              )}
              {isDone && (
                <button
                  onClick={() => onUpdate(todo.id, { status: 'doing' })}
                  className="text-[11px] px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-all"
                >
                  ↩ 進行中に戻す
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EstimateButton({ attachments }: { attachments: Todo['attachments'] }) {
  const estFile = attachments.find((a) => a.name.includes('見積'))
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (estFile?.url) {
      window.open(estFile.url, '_blank')
    } else {
      alert('見積書ファイルが添付されていません。\n今後、ファイルをアップロードすると表示できます。')
    }
  }
  return (
    <button
      onClick={handleClick}
      title={estFile ? `見積書: ${estFile.name}` : '見積書なし'}
      className={`ml-auto flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
        estFile
          ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
          : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
      }`}
    >
      📄 見積書
    </button>
  )
}

function PriorityBadge({ priority }: { priority: '高' | '中' | '低' }) {
  const styles = {
    '高': 'bg-red-50 text-red-600',
    '中': 'bg-amber-50 text-amber-600',
    '低': 'bg-green-50 text-green-600',
  }
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${styles[priority]}`}>
      {priority}
    </span>
  )
}

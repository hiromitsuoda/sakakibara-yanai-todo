'use client'
import { useState } from 'react'
import type { Todo, Status, Priority, Staff } from '@/lib/types'

interface Props {
  todo: Todo
  staffList: Staff[]
  onClose: () => void
  onSave: (id: string, updates: Partial<Todo>) => void
}

const PRIORITY_OPTIONS: Priority[] = ['高', '中', '低']
const STATUS_OPTIONS: { value: Status; label: string; icon: string }[] = [
  { value: 'todo',      label: '未着手',     icon: '📋' },
  { value: 'doing',     label: '進行中',     icon: '⏳' },
  { value: 'done',      label: '完了',       icon: '✅' },
  { value: 'overdue',   label: '期限超過',   icon: '⚠️' },
  { value: 'cancelled', label: 'キャンセル', icon: '🚫' },
]
export default function EditTodoModal({ todo, staffList, onClose, onSave }: Props) {
  const [linkNo,   setLinkNo]   = useState(todo.link_no ?? '')
  const [title,    setTitle]    = useState(todo.title)
  const [detail,   setDetail]   = useState(todo.detail ?? '')
  const [task,     setTask]     = useState(todo.task ?? '')
  const [deadline, setDeadline] = useState(
    todo.deadline ? todo.deadline.replace(/\//g, '-') : '',
  )
  const [startTime, setStartTime] = useState(todo.start_time ?? '')
  const [endTime,   setEndTime]   = useState(todo.end_time   ?? '')
  const [staffId,  setStaffId]  = useState(todo.staff_id)
  const [priority, setPriority] = useState<Priority>(todo.priority)
  const [status,   setStatus]   = useState<Status>(todo.status)
  const [errors,   setErrors]   = useState<string[]>([])

  const handleSave = () => {
    const errs: string[] = []
    if (!title.trim()) errs.push('案件タイトルは必須です')
    if (errs.length > 0) { setErrors(errs); return }

    onSave(todo.id, {
      link_no:    linkNo.trim() || undefined,
      title:      title.trim(),
      detail:     detail.trim() || undefined,
      task:       task.trim() || undefined,
      deadline:   deadline ? deadline.replace(/-/g, '/') : undefined,
      start_time: startTime || undefined,
      end_time:   endTime   || undefined,
      staff_id:   staffId,
      priority,
      status,
    })
    onClose()
  }

  const displayStaff = staffList.filter((s) => s.id !== 'all')

  return (
    <div className="modal-backdrop fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700">✏</div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">TODO編集</h2>
            <p className="text-xs text-slate-500 truncate max-w-xs">{todo.title}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-600 text-lg">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              {errors.map((e, i) => <p key={i} className="text-xs text-red-600">⚠ {e}</p>)}
            </div>
          )}

          {/* Link No */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">Link番号（任意）</label>
            <input
              type="text"
              value={linkNo}
              onChange={(e) => setLinkNo(e.target.value)}
              placeholder="例: 4200"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">案件タイトル <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Detail */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">案件詳細（任意）</label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={3}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:border-teal-500 focus:outline-none resize-none"
            />
          </div>

          {/* Task */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">備考・作業メモ（任意）</label>
            <input
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">期限日</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Time */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">作業時間（任意）</label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:border-teal-500 focus:outline-none"
              />
              <span className="text-slate-400 text-sm">〜</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Staff & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1.5">担当者</label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:border-teal-500 focus:outline-none bg-white"
              >
                {displayStaff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1.5">優先度</label>
              <div className="flex gap-1.5">
                {PRIORITY_OPTIONS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                      priority === p
                        ? p === '高' ? 'bg-red-500 text-white border-red-500'
                          : p === '中' ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-green-500 text-white border-green-500'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">ステータス</label>
            <div className="grid grid-cols-2 gap-1.5">
              {STATUS_OPTIONS.map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => setStatus(value)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all border ${
                    status === value
                      ? value === 'overdue'   ? 'bg-red-500 text-white border-red-500'
                        : value === 'done'    ? 'bg-green-500 text-white border-green-500'
                        : value === 'cancelled' ? 'bg-slate-500 text-white border-slate-500'
                        : 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
            >
              変更を保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import type { Todo, Status, Priority, Staff } from '@/lib/types'

interface Props {
  defaultStatus?: Status
  staffList: Staff[]
  onClose: () => void
  onAdd: (todo: Omit<Todo, 'id' | 'created_at' | 'updated_at'>) => void
}

const PRIORITY_OPTIONS: Priority[] = ['高', '中', '低']
const STATUS_OPTIONS: { value: Status; label: string; icon: string }[] = [
  { value: 'todo',    label: '未着手', icon: '📋' },
  { value: 'doing',   label: '進行中', icon: '⏳' },
  { value: 'done',    label: '完了',   icon: '✅' },
  { value: 'overdue', label: '期限超過', icon: '⚠️' },
]

export default function AddTodoModal({ defaultStatus = 'todo', staffList, onClose, onAdd }: Props) {
  const [linkNo, setLinkNo] = useState('')
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [task, setTask] = useState('')
  const [deadline, setDeadline] = useState('')
  const [staffId, setStaffId] = useState(staffList.filter((s) => s.id !== 'all')[0]?.id ?? '')
  const [priority, setPriority] = useState<Priority>('中')
  const [status, setStatus] = useState<Status>(defaultStatus)
  const [errors, setErrors] = useState<string[]>([])

  const handleSubmit = () => {
    const errs: string[] = []
    if (!title.trim()) errs.push('案件タイトルは必須です')
    if (!deadline) errs.push('期限日は必須です')
    if (errs.length > 0) { setErrors(errs); return }

    onAdd({
      link_no: linkNo.trim() || undefined,
      title: title.trim(),
      detail: detail.trim() || undefined,
      task: task.trim() || undefined,
      staff_id: staffId,
      status,
      priority,
      tags: [],
      deadline: deadline.replace(/-/g, '/'),
      comment: '',
      attachments: [],
    })
    onClose()
  }

  return (
    <div className="modal-backdrop fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700">＋</div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">新規TODO作成</h2>
            <p className="text-xs text-slate-500">案件情報を入力してください</p>
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
              placeholder="例: 【建設業許可】営業所変更届出"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Detail */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">案件詳細（任意）</label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="作業内容の詳細..."
              rows={3}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:border-teal-500 focus:outline-none resize-none"
            />
          </div>

          {/* Task / 備考 */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">備考・作業メモ（任意）</label>
            <input
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="例: 出来たら連絡・変更届に係る"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">期限日 <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:border-teal-500 focus:outline-none"
            />
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
                {staffList.filter((s) => s.id !== 'all').map((s) => (
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
                      ? value === 'overdue'
                        ? 'bg-red-500 text-white border-red-500'
                        : value === 'done'
                        ? 'bg-green-500 text-white border-green-500'
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
            <button onClick={onClose} className="flex-1 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all">
              キャンセル
            </button>
            <button onClick={handleSubmit} className="flex-1 py-2.5 text-xs font-bold bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all">
              ＋ 作成する
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

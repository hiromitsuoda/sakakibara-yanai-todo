'use client'
import { useState } from 'react'
import type { Todo, Status, Priority, TagType } from '@/lib/types'
import { STAFF_LIST } from '@/lib/types'

interface Props {
  defaultStatus?: Status
  onClose: () => void
  onAdd: (todo: Omit<Todo, 'id' | 'created_at' | 'updated_at'>) => void
}

const TAG_OPTIONS: TagType[] = ['許可申請', '変更届', '相談対応', '法人', '更新', 'その他']
const PRIORITY_OPTIONS: Priority[] = ['高', '中', '低']

export default function AddTodoModal({ defaultStatus = 'todo', onClose, onAdd }: Props) {
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [staffId, setStaffId] = useState('sakaki')
  const [status, setStatus] = useState<Status>(defaultStatus)
  const [priority, setPriority] = useState<Priority>('中')
  const [tags, setTags] = useState<TagType[]>([])
  const [deadline, setDeadline] = useState('')
  const [linkNo, setLinkNo] = useState('')
  const [errors, setErrors] = useState<string[]>([])

  const toggleTag = (tag: TagType) => {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  const handleSubmit = () => {
    const errs: string[] = []
    if (!title.trim()) errs.push('案件タイトルは必須です')
    if (!deadline) errs.push('期限日は必須です')
    if (errs.length > 0) { setErrors(errs); return }

    onAdd({
      link_no: linkNo || undefined,
      title: title.trim(),
      detail: detail.trim() || undefined,
      staff_id: staffId,
      status,
      priority,
      tags,
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
          <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">＋</div>
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
                {STAFF_LIST.filter((s) => s.id !== 'all').map((s) => (
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
              {(['todo', 'doing'] as Status[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all border ${
                    status === s ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-500 border-slate-200'
                  }`}
                >
                  {s === 'todo' ? '📋 未着手' : '⏳ 進行中'}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">タグ</label>
            <div className="flex flex-wrap gap-1.5">
              {TAG_OPTIONS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                    tags.includes(tag) ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-500 border-slate-200 hover:border-teal-300'
                  }`}
                >
                  {tag}
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

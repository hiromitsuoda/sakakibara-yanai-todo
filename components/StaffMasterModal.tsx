'use client'
import { useState } from 'react'
import type { Staff } from '@/lib/types'
import { FIXED_STAFF_IDS } from '@/lib/useStaff'

interface Props {
  staffList: Staff[]
  onAdd:    (staff: Omit<Staff, 'id'>) => void
  onUpdate: (id: string, updates: Partial<Omit<Staff, 'id'>>) => void
  onDelete: (id: string) => void
  onClose:  () => void
}

// カラーパレット（選択肢）
const PALETTE = [
  '#7c3aed', '#2563eb', '#dc2626', '#0891b2', '#65a30d',
  '#d97706', '#db2777', '#059669', '#94a3b8', '#f97316',
]

interface EditState {
  id:      string | null  // null = 新規追加モード
  name:    string
  initial: string
  color:   string
}

const EMPTY_EDIT: EditState = { id: null, name: '', initial: '', color: PALETTE[0] }

export default function StaffMasterModal({
  staffList, onAdd, onUpdate, onDelete, onClose,
}: Props) {
  const [edit, setEdit]           = useState<EditState>(EMPTY_EDIT)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [inlineEdit, setInlineEdit] = useState<EditState>(EMPTY_EDIT)

  // ── 新規追加 ──────────────────────────────────────────────
  const handleAdd = () => {
    const name    = edit.name.trim()
    const initial = edit.initial.trim() || name.slice(0, 1)
    if (!name) return
    onAdd({ name, initial, color: edit.color })
    setEdit(EMPTY_EDIT)
  }

  // ── インライン編集開始 ────────────────────────────────────
  const startEdit = (s: Staff) => {
    setEditingId(s.id)
    setInlineEdit({ id: s.id, name: s.name, initial: s.initial, color: s.color })
  }

  // ── インライン編集保存 ────────────────────────────────────
  const saveEdit = () => {
    if (!editingId) return
    const name    = inlineEdit.name.trim()
    const initial = inlineEdit.initial.trim() || name.slice(0, 1)
    if (name) onUpdate(editingId, { name, initial, color: inlineEdit.color })
    setEditingId(null)
  }

  // 表示用リスト（「全員」は非表示にするか最初に）
  const displayList = staffList.filter((s) => s.id !== 'all')

  return (
    <div className="modal-backdrop fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* ヘッダー */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-lg">⚙️</div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">担当者マスター</h2>
            <p className="text-xs text-slate-500">担当者の追加・編集・削除ができます</p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-600 text-lg leading-none">✕</button>
        </div>

        {/* スタッフ一覧 */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {displayList.map((s) => {
            const isFixed   = FIXED_STAFF_IDS.has(s.id)
            const isEditing = editingId === s.id

            return (
              <div
                key={s.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isEditing ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-white'
                }`}
              >
                {/* アバター */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: isEditing ? inlineEdit.color : s.color }}
                >
                  {isEditing ? inlineEdit.initial || inlineEdit.name.slice(0, 1) : s.initial}
                </div>

                {/* 名前 / 編集フォーム */}
                {isEditing ? (
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="flex gap-2">
                      <input
                        value={inlineEdit.name}
                        onChange={(e) => setInlineEdit((p) => ({ ...p, name: e.target.value }))}
                        placeholder="氏名"
                        className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-teal-500 focus:outline-none"
                      />
                      <input
                        value={inlineEdit.initial}
                        onChange={(e) => setInlineEdit((p) => ({ ...p, initial: e.target.value.slice(0, 2) }))}
                        placeholder="略"
                        className="w-14 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-teal-500 focus:outline-none text-center"
                      />
                    </div>
                    {/* カラーパレット */}
                    <div className="flex gap-1.5 flex-wrap">
                      {PALETTE.map((c) => (
                        <button
                          key={c}
                          onClick={() => setInlineEdit((p) => ({ ...p, color: c }))}
                          className={`w-5 h-5 rounded-full transition-all ${inlineEdit.color === c ? 'ring-2 ring-offset-1 ring-teal-500 scale-110' : ''}`}
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{s.name}</p>
                    {isFixed && (
                      <p className="text-[10px] text-slate-400">固定（変更不可）</p>
                    )}
                  </div>
                )}

                {/* アクションボタン */}
                <div className="flex gap-1.5 shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        onClick={saveEdit}
                        className="px-3 py-1.5 text-xs font-bold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-all"
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      {!isFixed && (
                        <button
                          onClick={() => startEdit(s)}
                          className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-500 hover:border-teal-300 hover:text-teal-600 transition-all"
                        >
                          編集
                        </button>
                      )}
                      {!isFixed && (
                        <button
                          onClick={() => {
                            if (confirm(`「${s.name}」を削除しますか？`)) onDelete(s.id)
                          }}
                          className="px-2.5 py-1.5 text-xs border border-red-100 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          削除
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* 新規追加フォーム */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl shrink-0 space-y-3">
          <p className="text-xs font-bold text-slate-600">＋ 担当者を追加</p>
          <div className="flex gap-2">
            <input
              value={edit.name}
              onChange={(e) => setEdit((p) => ({ ...p, name: e.target.value }))}
              placeholder="氏名（例：田中）"
              className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:border-teal-500 focus:outline-none bg-white"
            />
            <input
              value={edit.initial}
              onChange={(e) => setEdit((p) => ({ ...p, initial: e.target.value.slice(0, 2) }))}
              placeholder="略"
              className="w-14 text-xs border border-slate-200 rounded-lg px-2.5 py-2 focus:border-teal-500 focus:outline-none bg-white text-center"
            />
          </div>
          {/* カラーパレット */}
          <div className="flex gap-1.5 flex-wrap items-center">
            <span className="text-[10px] text-slate-400">カラー：</span>
            {PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => setEdit((p) => ({ ...p, color: c }))}
                className={`w-5 h-5 rounded-full transition-all ${edit.color === c ? 'ring-2 ring-offset-1 ring-teal-500 scale-110' : ''}`}
                style={{ background: c }}
              />
            ))}
            {/* プレビュー */}
            <div
              className="ml-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: edit.color }}
            >
              {edit.initial || edit.name.slice(0, 1) || '？'}
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={!edit.name.trim()}
            className="w-full py-2.5 text-xs font-bold bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all disabled:opacity-40"
          >
            追加する
          </button>
        </div>
      </div>
    </div>
  )
}

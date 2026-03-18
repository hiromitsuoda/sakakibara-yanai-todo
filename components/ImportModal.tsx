'use client'
import { useState, useRef } from 'react'
import type { Todo, TagType } from '@/lib/types'

interface Props {
  onClose: () => void
  onImport: (todos: Partial<Todo>[]) => void
}

type Step = 'select' | 'preview' | 'done'

// Mock parsed CSV rows
const MOCK_PARSED = [
  { link_no: '4200', title: '【建設業許可】新規許可申請（土木工事業）', deadline: '2026/04/05', staff_id: 'sakaki', priority: '高' as const, tags: ['許可申請'] as TagType[] },
  { link_no: '4201', title: '【産廃】中間処理業 新規許可申請', deadline: '2026/04/10', staff_id: 'yanai', priority: '中' as const, tags: ['許可申請'] as TagType[] },
  { link_no: '4202', title: '【建設業許可】決算変更届出（令和6年度）', deadline: '2026/04/30', staff_id: 'sakaki', priority: '低' as const, tags: ['変更届'] as TagType[] },
  { link_no: '4203', title: '相続財産管理 戸籍・登記確認', deadline: '2026/04/15', staff_id: 'yamamoto', priority: '低' as const, tags: ['相談対応'] as TagType[] },
]

export default function ImportModal({ onClose, onImport }: Props) {
  const [step, setStep] = useState<Step>('select')
  const [tab, setTab] = useState<'csv' | 'pdf'>('csv')
  const [fileName, setFileName] = useState('')
  const [progress, setProgress] = useState(0)
  const [selected, setSelected] = useState<Set<number>>(new Set([0, 1, 2, 3]))
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    // Mock parsing progress
    let p = 0
    const interval = setInterval(() => {
      p += 20
      setProgress(p)
      if (p >= 100) {
        clearInterval(interval)
        setStep('preview')
      }
    }, 150)
  }

  const handleImport = () => {
    const toImport = MOCK_PARSED
      .filter((_, i) => selected.has(i))
      .map((row) => ({
        ...row,
        id: crypto.randomUUID(),
        status: 'todo' as const,
        comment: '',
        attachments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
    onImport(toImport)
    setStep('done')
  }

  const toggleRow = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  return (
    <div className="modal-backdrop fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-xl">
        {/* Modal header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-lg">
            {tab === 'csv' ? '📥' : '📎'}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              {step === 'done' ? '取込完了' : 'データ取込'}
            </h2>
            <p className="text-xs text-slate-500">AccessのCSVまたはPDFを読み込んでTODOを生成します</p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-600 text-lg leading-none">✕</button>
        </div>

        {/* Step: select */}
        {step === 'select' && (
          <div className="p-5 space-y-4">
            {/* Tab */}
            <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setTab('csv')}
                className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${tab === 'csv' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'}`}
              >
                📥 CSV ファイル
              </button>
              <button
                onClick={() => setTab('pdf')}
                className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${tab === 'pdf' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'}`}
              >
                📎 PDF ファイル
              </button>
            </div>

            {tab === 'csv' ? (
              <>
                {/* Info */}
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-xs text-teal-700 space-y-1">
                  <p className="font-bold">📋 対応CSV形式（AccessエクスポートのShift-JIS）</p>
                  <p className="text-teal-600">Link番号 / 開始日 / 終了日 / 予定タイトル / 予定詳細 / 担当者</p>
                </div>
                {/* Drop zone */}
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-teal-300 rounded-xl p-8 text-center cursor-pointer hover:bg-teal-50 transition-all"
                >
                  <div className="text-4xl mb-3">📂</div>
                  <p className="text-sm font-semibold text-teal-700">クリックしてCSVを選択</p>
                  <p className="text-xs text-slate-400 mt-1">または、ここにドラッグ＆ドロップ</p>
                  {progress > 0 && progress < 100 && (
                    <div className="mt-4">
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">解析中... {progress}%</p>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
                </div>
                {/* Demo button */}
                <button
                  onClick={() => { setFileName('日報CSV出力.CSV'); setStep('preview') }}
                  className="w-full py-2 text-xs font-semibold text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 transition-all"
                >
                  🔍 デモデータでプレビューを確認する
                </button>
              </>
            ) : (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 space-y-1">
                  <p className="font-bold">📎 PDF添付について</p>
                  <p>見積書・申請書類などのPDFを取込み、TODO案件に関連付けできます。</p>
                </div>
                <div
                  className="border-2 border-dashed border-amber-300 rounded-xl p-8 text-center cursor-pointer hover:bg-amber-50 transition-all"
                  onClick={() => fileRef.current?.click()}
                >
                  <div className="text-4xl mb-3">📄</div>
                  <p className="text-sm font-semibold text-amber-700">クリックしてPDFを選択</p>
                  <p className="text-xs text-slate-400 mt-1">複数選択可能</p>
                  <input ref={fileRef} type="file" accept=".pdf" multiple className="hidden" onChange={() => {}} />
                </div>
                <p className="text-xs text-slate-500 text-center">※ この機能は実装予定です（モック段階）</p>
              </>
            )}
          </div>
        )}

        {/* Step: preview */}
        {step === 'preview' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
              <span className="text-green-600">✓</span>
              <span><strong>{fileName || '日報CSV出力.CSV'}</strong> を解析しました</span>
              <span className="ml-auto text-slate-400">{MOCK_PARSED.length}件検出</span>
            </div>

            <p className="text-xs text-slate-600 font-medium">取り込むTODOを選択してください</p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {MOCK_PARSED.map((row, i) => (
                <label
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selected.has(i) ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => toggleRow(i)}
                    className="mt-0.5 accent-teal-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] text-slate-400 font-bold">#{row.link_no}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        row.priority === '高' ? 'bg-red-50 text-red-600' :
                        row.priority === '中' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                      }`}>{row.priority}</span>
                      <span className="text-[10px] text-slate-400 ml-auto">📅 {row.deadline}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 leading-snug">{row.title}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setStep('select')} className="flex-1 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all">
                ← 戻る
              </button>
              <button
                onClick={handleImport}
                disabled={selected.size === 0}
                className="flex-1 py-2.5 text-xs font-bold bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all disabled:opacity-40"
              >
                {selected.size}件 取込む
              </button>
            </div>
          </div>
        )}

        {/* Step: done */}
        {step === 'done' && (
          <div className="p-8 text-center space-y-4">
            <div className="text-5xl">✅</div>
            <div>
              <p className="text-base font-bold text-slate-800">取込み完了！</p>
              <p className="text-sm text-slate-500 mt-1">{selected.size}件のTODOを「未着手」に追加しました</p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 transition-all"
            >
              閉じる
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'
import { useState, useRef } from 'react'
import type { Todo, TagType, Priority } from '@/lib/types'

interface Props {
  onClose: () => void
  onImport: (todos: Partial<Todo>[]) => void
  resolveStaffId: (csvName: string) => string  // useStaff() から渡す
}

type Step = 'select' | 'preview' | 'done'

/** 解析済みCSV行の内部型 */
interface ParsedRow {
  link_no: string
  title: string
  detail: string   // col[7] 予定詳細
  task: string     // col[8] メモ → カードに表示
  deadline: string
  start_time: string
  end_time: string
  staff_name: string
  staff_id: string
  priority: Priority
  tags: TagType[]
}

// ── ヘルパー関数 ──────────────────────────────────────────────

/**
 * CSVの1行（RFC4180準拠）をフィールド配列にパース
 * ダブルクォート囲み・カンマ内包に対応
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let i = 0
  while (i < line.length) {
    if (line[i] === '"') {
      // クォート囲みフィールド
      i++
      let field = ''
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') { field += '"'; i += 2 }
          else { i++; break }
        } else {
          field += line[i++]
        }
      }
      fields.push(field)
      if (line[i] === ',') i++
    } else {
      // 非クォートフィールド
      const end = line.indexOf(',', i)
      if (end === -1) { fields.push(line.slice(i)); i = line.length }
      else { fields.push(line.slice(i, end)); i = end + 1 }
    }
  }
  return fields
}

/**
 * "YYYY/M/D 0:00:00" 形式を "YYYY/MM/DD" に正規化
 * 既に "YYYY/MM/DD" の場合はそのまま返す
 */
function normalizeDate(raw: string): string {
  if (!raw) return ''
  const m = raw.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/)
  if (!m) return raw
  return `${m[1]}/${m[2].padStart(2, '0')}/${m[3].padStart(2, '0')}`
}

/**
 * "HH:mm" 文字列をそのまま返す（空なら ''）
 */
function normalizeTime(raw: string): string {
  return raw?.trim() ?? ''
}

/**
 * タイトルからタグを自動推定
 */
function inferTags(title: string, detail: string): TagType[] {
  const text = title + detail
  const tags: TagType[] = []
  if (/許可申請|許可/.test(text)) tags.push('許可申請')
  else if (/変更届|変更/.test(text)) tags.push('変更届')
  else if (/更新/.test(text)) tags.push('更新')
  else if (/相談|打ち合わせ|打合せ/.test(text)) tags.push('相談対応')
  else if (/法人/.test(text)) tags.push('法人')
  if (tags.length === 0) tags.push('その他')
  return tags
}

// resolveStaffId は props 経由で useStaff() フックから受け取る

/**
 * CSVテキスト全体をパースして ParsedRow[] を返す
 * 予定タイトル（col[6]）が空の行はスキップ
 */
function parseCsvText(text: string, resolveStaffId: (name: string) => string): ParsedRow[] {
  const lines = text.split(/\r?\n/)
  if (lines.length < 2) return []

  // ヘッダー行をスキップして2行目以降をパース
  const rows: ParsedRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cols = parseCsvLine(line)

    // 列: 0=Link受託番号, 2=開始日付, 3=開始時刻, 4=終了日付, 5=終了時刻
    //     6=予定, 7=予定詳細, 8=メモ, 9=参加者
    const title = (cols[6] ?? '').trim()
    if (!title) continue // タイトルなしの行はスキップ

    const link_no    = (cols[0] ?? '').trim()
    const startDate  = normalizeDate(cols[2] ?? '')
    const start_time = normalizeTime(cols[3] ?? '')
    const endDate    = normalizeDate(cols[4] ?? '')
    const end_time   = normalizeTime(cols[5] ?? '')
    const detail     = (cols[7] ?? '').trim()  // 予定詳細
    const task       = (cols[8] ?? '').trim()  // メモ → todoのtaskフィールドへ
    const staff_name = (cols[9] ?? '').trim()
    const staff_id   = resolveStaffId(staff_name)

    // 期限日：終了日が存在すれば終了日、なければ開始日
    const deadline = endDate || startDate

    rows.push({
      link_no,
      title,
      detail,
      task,
      deadline,
      start_time,
      end_time,
      staff_name,
      staff_id,
      priority: '中',
      tags: inferTags(title, detail),
    })
  }

  return rows
}

// ── デモ用モックデータ ──────────────────────────────────────
const DEMO_ROWS: ParsedRow[] = [
  {
    link_no: '4200', title: '【建設業許可】新規許可申請（土木工事業）',
    detail: '', task: '', deadline: '2026/04/05', start_time: '', end_time: '',
    staff_name: '榊原', staff_id: 'sakaki',
    priority: '高', tags: ['許可申請'],
  },
  {
    link_no: '4201', title: '【産廃】中間処理業 新規許可申請',
    detail: '', task: '', deadline: '2026/04/10', start_time: '', end_time: '',
    staff_name: '柳井', staff_id: 'yanai',
    priority: '中', tags: ['許可申請'],
  },
  {
    link_no: '4202', title: '【建設業許可】決算変更届出（令和6年度）',
    detail: '', task: '', deadline: '2026/04/30', start_time: '', end_time: '',
    staff_name: '榊原', staff_id: 'sakaki',
    priority: '低', tags: ['変更届'],
  },
  {
    link_no: '4203', title: '相続財産管理 戸籍・登記確認',
    detail: '', task: '', deadline: '2026/04/15', start_time: '', end_time: '',
    staff_name: '山本', staff_id: 'yamamoto',
    priority: '低', tags: ['相談対応'],
  },
]

// ── コンポーネント本体 ────────────────────────────────────────

export default function ImportModal({ onClose, onImport, resolveStaffId }: Props) {
  const [step, setStep]         = useState<Step>('select')
  const [tab, setTab]           = useState<'csv' | 'pdf'>('csv')
  const [fileName, setFileName] = useState('')
  const [progress, setProgress] = useState(0)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [errorMsg, setErrorMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // ── ファイル読み込み ─────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setErrorMsg('')
    setProgress(10)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        setProgress(60)
        // Shift-JIS デコード
        const bytes = ev.target?.result as ArrayBuffer
        const text  = new TextDecoder('shift-jis').decode(bytes)
        setProgress(80)
        const rows = parseCsvText(text, resolveStaffId)
        setProgress(100)

        if (rows.length === 0) {
          setErrorMsg('取込可能な行が見つかりませんでした。「予定」列が空のCSVです。')
          setProgress(0)
          return
        }

        setParsedRows(rows)
        // 全行をデフォルト選択
        setSelected(new Set(rows.map((_, i) => i)))
        setStep('preview')
      } catch (err) {
        setErrorMsg('CSVの解析に失敗しました。文字コードを確認してください。')
        setProgress(0)
        console.error(err)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // ── デモプレビュー ───────────────────────────────────────
  const handleDemo = () => {
    setParsedRows(DEMO_ROWS)
    setSelected(new Set(DEMO_ROWS.map((_, i) => i)))
    setFileName('日報CSV出力.CSV（デモ）')
    setStep('preview')
  }

  // ── 取込実行 ─────────────────────────────────────────────
  const handleImport = () => {
    const toImport = parsedRows
      .filter((_, i) => selected.has(i))
      .map((row) => ({
        link_no:     row.link_no || undefined,
        title:       row.title,
        detail:      row.detail || undefined,
        task:        row.task || undefined,
        deadline:    row.deadline || undefined,
        start_time:  row.start_time || undefined,
        end_time:    row.end_time || undefined,
        staff_id:    row.staff_id,
        status:      'todo' as const,
        priority:    row.priority,
        tags:        row.tags,
        attachments: [],
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

  const toggleAll = () => {
    if (selected.size === parsedRows.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(parsedRows.map((_, i) => i)))
    }
  }

  // ── JSX ──────────────────────────────────────────────────
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

        {/* ── Step: select ── */}
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
                  <p className="text-teal-600">Link番号 / 開始日 / 終了日 / 予定 / 予定詳細 / メモ / 参加者</p>
                </div>

                {/* Error */}
                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600">
                    ⚠ {errorMsg}
                  </div>
                )}

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
                        <div className="h-full bg-teal-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">解析中... {progress}%</p>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
                </div>

                {/* Demo button */}
                <button
                  onClick={handleDemo}
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

        {/* ── Step: preview ── */}
        {step === 'preview' && (
          <div className="p-5 space-y-3">
            {/* File info bar */}
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
              <span className="text-green-600">✓</span>
              <span><strong>{fileName}</strong> を解析しました</span>
              <span className="ml-auto text-slate-400">{parsedRows.length}件検出</span>
            </div>

            {/* 全選択/解除 */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-600 font-medium">取り込むTODOを選択してください</p>
              <button
                onClick={toggleAll}
                className="text-[11px] text-teal-600 hover:underline"
              >
                {selected.size === parsedRows.length ? '全解除' : '全選択'}
              </button>
            </div>

            {/* Row list */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {parsedRows.map((row, i) => (
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
                    {/* 上段メタ */}
                    <div className="flex items-center gap-2 mb-0.5">
                      {row.link_no && (
                        <span className="text-[10px] text-slate-400 font-bold">#{row.link_no}</span>
                      )}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        row.priority === '高' ? 'bg-red-50 text-red-600' :
                        row.priority === '中' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                      }`}>{row.priority}</span>
                      {row.tags.map((tag) => (
                        <span key={tag} className="text-[10px] bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded font-medium">{tag}</span>
                      ))}
                      {row.deadline && (
                        <span className="text-[10px] text-slate-400 ml-auto">📅 {row.deadline}</span>
                      )}
                    </div>
                    {/* タイトル */}
                    <p className="text-xs font-semibold text-slate-700 leading-snug">{row.title}</p>
                    {/* 担当者 */}
                    <p className="text-[10px] text-slate-400 mt-0.5">👤 {row.staff_name || '（担当者未設定）'}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button onClick={() => setStep('select')} className="flex-1 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all">
                ← 戻る
              </button>
              <button
                onClick={handleImport}
                disabled={selected.size === 0}
                className="flex-1 py-2.5 text-xs font-bold bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all disabled:opacity-40"
              >
                {selected.size}件 取込む →
              </button>
            </div>
          </div>
        )}

        {/* ── Step: done ── */}
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
              閉じる → Kanbanを確認
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

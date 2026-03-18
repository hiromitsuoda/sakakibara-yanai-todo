'use client'
import { STAFF_LIST, type Staff } from '@/lib/types'

interface Props {
  selectedStaffId: string
  onStaffChange: (id: string) => void
  onImportClick: () => void
  onAddClick: () => void
}

export default function Header({ selectedStaffId, onStaffChange, onImportClick, onAddClick }: Props) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b-2 border-teal-600 shadow-sm">
      <div className="flex items-center gap-3 px-4 h-14">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-black text-sm select-none">
            榊
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold text-teal-700 leading-tight">行政書士法人</div>
            <div className="text-xs font-bold text-teal-600 leading-tight">榊原・箭内事務所</div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-7 bg-slate-200 mx-1" />

        {/* Staff switcher */}
        <div className="hidden md:flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
          {STAFF_LIST.map((s) => (
            <button
              key={s.id}
              onClick={() => onStaffChange(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                selectedStaffId === s.id
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {s.id !== 'all' && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: s.color }}
                />
              )}
              {s.name}
            </button>
          ))}
        </div>

        {/* Mobile staff select */}
        <select
          className="md:hidden text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700"
          value={selectedStaffId}
          onChange={(e) => onStaffChange(e.target.value)}
        >
          {STAFF_LIST.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onImportClick}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:border-teal-400 hover:text-teal-600 transition-all bg-white"
          >
            <span>📥</span>
            <span className="hidden lg:inline">CSV取込</span>
          </button>
          <button
            onClick={onImportClick}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:border-teal-400 hover:text-teal-600 transition-all bg-white"
          >
            <span>📎</span>
            <span className="hidden lg:inline">PDF添付</span>
          </button>
          <button
            onClick={onAddClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 transition-all"
          >
            <span>＋</span>
            <span>TODO</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-teal-700 transition-colors">
            榊
          </div>
        </div>
      </div>
    </header>
  )
}

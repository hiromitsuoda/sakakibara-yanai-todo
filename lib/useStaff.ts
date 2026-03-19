'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Staff } from '@/lib/types'
import { DEFAULT_STAFF_LIST } from '@/lib/types'

const LS_KEY = 'todo_staff_list'

/** 削除・移動不可の固定スタッフID */
export const FIXED_STAFF_IDS = new Set(['all', 'unknown', 'other'])

/** localStorage からスタッフ一覧を読み込む */
function loadStaff(): Staff[] {
  if (typeof window === 'undefined') return DEFAULT_STAFF_LIST
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return DEFAULT_STAFF_LIST
    const parsed: Staff[] = JSON.parse(raw)
    // 固定スタッフが必ず存在するよう保証
    const ids = new Set(parsed.map((s) => s.id))
    const fixed = DEFAULT_STAFF_LIST.filter((s) => FIXED_STAFF_IDS.has(s.id))
    for (const f of fixed) {
      if (!ids.has(f.id)) parsed.push(f)
    }
    return parsed
  } catch {
    return DEFAULT_STAFF_LIST
  }
}

function saveStaff(list: Staff[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LS_KEY, JSON.stringify(list))
}

// ── フック本体 ─────────────────────────────────────────────────

export function useStaff() {
  // SSRとクライアントで初期値を一致させるため DEFAULT_STAFF_LIST で初期化
  const [staffList, setStaffList] = useState<Staff[]>(DEFAULT_STAFF_LIST)

  // マウント後にのみ localStorage を読み込む（hydration mismatch防止）
  useEffect(() => {
    const loaded = loadStaff()
    setStaffList(loaded)
  }, [])

  const persist = useCallback((next: Staff[]) => {
    setStaffList(next)
    saveStaff(next)
  }, [])

  /** スタッフ追加 */
  const addStaff = useCallback((staff: Omit<Staff, 'id'>) => {
    const id = `staff_${Date.now()}`
    setStaffList((prev) => {
      // 「全員」「その他」「不明」の直前に挿入
      const fixedStart = prev.findIndex((s) => s.id === 'other')
      const insertAt = fixedStart >= 0 ? fixedStart : prev.length - 1
      const next = [...prev]
      next.splice(insertAt, 0, { ...staff, id })
      persist(next)
      return next
    })
  }, [persist])

  /** スタッフ更新（固定IDは変更不可） */
  const updateStaff = useCallback((id: string, updates: Partial<Omit<Staff, 'id'>>) => {
    if (FIXED_STAFF_IDS.has(id)) return
    setStaffList((prev) => {
      const next = prev.map((s) => s.id === id ? { ...s, ...updates } : s)
      persist(next)
      return next
    })
  }, [persist])

  /** スタッフ削除（固定IDは削除不可） */
  const deleteStaff = useCallback((id: string) => {
    if (FIXED_STAFF_IDS.has(id)) return
    setStaffList((prev) => {
      const next = prev.filter((s) => s.id !== id)
      persist(next)
      return next
    })
  }, [persist])

  /**
   * CSVの参加者名から staff_id を返す
   * - スタッフリストの名前で部分一致検索（固定スタッフは除外）
   * - マッチしなければ 'unknown' を返す
   */
  const resolveStaffId = useCallback((csvName: string): string => {
    const name = csvName.trim()
    if (!name) return 'unknown'

    const candidates = staffList.filter(
      (s) => !FIXED_STAFF_IDS.has(s.id)
    )

    // 完全一致
    const exact = candidates.find((s) => s.name === name)
    if (exact) return exact.id

    // 部分一致（どちらかが含む）
    const partial = candidates.find(
      (s) => name.includes(s.name) || s.name.includes(name)
    )
    if (partial) return partial.id

    return 'unknown'
  }, [staffList])

  return { staffList, addStaff, updateStaff, deleteStaff, resolveStaffId }
}

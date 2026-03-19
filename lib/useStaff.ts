'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Staff } from '@/lib/types'
import { DEFAULT_STAFF_LIST } from '@/lib/types'
import {
  fetchStaff,
  addStaffToDB,
  updateStaffInDB,
  deleteStaffFromDB,
} from '@/lib/supabase'

/** 削除・編集不可の固定スタッフID（DB には保存しない） */
export const FIXED_STAFF_IDS = new Set(['all', 'unknown', 'other'])

const FIXED_HEAD  = DEFAULT_STAFF_LIST.filter((s) => s.id === 'all')
const FIXED_TAIL  = DEFAULT_STAFF_LIST.filter((s) => ['other', 'unknown'].includes(s.id))

// ── フック本体 ──────────────────────────────────────────────

export function useStaff() {
  const [staffList, setStaffList] = useState<Staff[]>(DEFAULT_STAFF_LIST)

  // マウント時に Supabase からスタッフ一覧を取得
  useEffect(() => {
    fetchStaff()
      .then((dbStaff) => {
        if (dbStaff.length > 0) {
          setStaffList([...FIXED_HEAD, ...dbStaff, ...FIXED_TAIL])
        }
      })
      .catch(() => {
        // 接続失敗時はデフォルトリストのまま
      })
  }, [])

  /** スタッフ追加 */
  const addStaff = useCallback((staff: Omit<Staff, 'id'>) => {
    const id = `staff_${Date.now()}`
    const newStaff: Staff = { ...staff, id }

    // 楽観的 UI 更新（固定スタッフの直前に挿入）
    setStaffList((prev) => {
      const insertAt = prev.findIndex((s) => s.id === 'other')
      const next = [...prev]
      next.splice(insertAt >= 0 ? insertAt : prev.length - 2, 0, newStaff)
      return next
    })

    // Supabase に保存（非同期・fire-and-forget）
    addStaffToDB(newStaff).catch(() => {
      // 失敗時はロールバック
      setStaffList((prev) => prev.filter((s) => s.id !== id))
    })
  }, [])

  /** スタッフ更新（固定IDは変更不可） */
  const updateStaff = useCallback((id: string, updates: Partial<Omit<Staff, 'id'>>) => {
    if (FIXED_STAFF_IDS.has(id)) return

    setStaffList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    )

    updateStaffInDB(id, updates).catch(() => {
      // 失敗時は再取得して巻き戻す
      fetchStaff().then((dbStaff) =>
        setStaffList([...FIXED_HEAD, ...dbStaff, ...FIXED_TAIL]),
      )
    })
  }, [])

  /** スタッフ削除（固定IDは削除不可） */
  const deleteStaff = useCallback((id: string) => {
    if (FIXED_STAFF_IDS.has(id)) return

    setStaffList((prev) => prev.filter((s) => s.id !== id))

    deleteStaffFromDB(id).catch(() => {
      fetchStaff().then((dbStaff) =>
        setStaffList([...FIXED_HEAD, ...dbStaff, ...FIXED_TAIL]),
      )
    })
  }, [])

  /**
   * CSV の参加者名から staff_id を返す
   * マッチしなければ 'unknown' を返す
   */
  const resolveStaffId = useCallback(
    (csvName: string): string => {
      const name = csvName.trim()
      if (!name) return 'unknown'

      const candidates = staffList.filter((s) => !FIXED_STAFF_IDS.has(s.id))
      const exact   = candidates.find((s) => s.name === name)
      if (exact) return exact.id
      const partial = candidates.find(
        (s) => name.includes(s.name) || s.name.includes(name),
      )
      if (partial) return partial.id

      return 'unknown'
    },
    [staffList],
  )

  return { staffList, addStaff, updateStaff, deleteStaff, resolveStaffId }
}

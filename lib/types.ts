export type Status = 'overdue' | 'todo' | 'doing' | 'done'
export type Priority = '高' | '中' | '低'
export type TagType = '許可申請' | '変更届' | '相談対応' | '法人' | '更新' | 'その他'

export interface Staff {
  id: string
  name: string
  color: string
  initial: string
}

export interface Attachment {
  id: string
  name: string
  type: 'pdf' | 'xlsx' | 'doc'
  url?: string
}

export interface Todo {
  id: string
  link_no?: string
  title: string
  detail?: string
  task?: string
  staff_id: string
  status: Status
  priority: Priority
  tags: TagType[]
  deadline?: string   // YYYY/MM/DD
  start_time?: string // HH:mm
  end_time?: string   // HH:mm
  comment: string
  attachments: Attachment[]
  created_at: string
  updated_at: string
}

export const STAFF_LIST: Staff[] = [
  { id: 'all',       name: '全員', color: '#0d9488', initial: '全' },
  { id: 'tatsumoto', name: '立本', color: '#7c3aed', initial: '立' },
  { id: 'kaneko',    name: '金子', color: '#2563eb', initial: '金' },
  { id: 'sakaki',    name: '榊原', color: '#dc2626', initial: '榊' },
]

export const STATUS_CONFIG: Record<Status, { label: string; color: string; bgColor: string; borderColor: string; icon: string }> = {
  overdue: { label: '期限超過', color: '#dc2626', bgColor: '#fef2f2', borderColor: '#fecaca', icon: '⚠' },
  todo:    { label: '未着手',   color: '#ea580c', bgColor: '#fff7ed', borderColor: '#fed7aa', icon: '📋' },
  doing:   { label: '進行中',   color: '#2563eb', bgColor: '#eff6ff', borderColor: '#bfdbfe', icon: '⏳' },
  done:    { label: '完了',     color: '#16a34a', bgColor: '#f0fdf4', borderColor: '#bbf7d0', icon: '✅' },
}

export const TAG_CONFIG: Record<TagType, { bg: string; text: string }> = {
  '許可申請': { bg: '#f0fdf4', text: '#16a34a' },
  '変更届':   { bg: '#fff7ed', text: '#ea580c' },
  '相談対応': { bg: '#eff6ff', text: '#2563eb' },
  '法人':     { bg: '#faf5ff', text: '#9333ea' },
  '更新':     { bg: '#fef3c7', text: '#d97706' },
  'その他':   { bg: '#f1f5f9', text: '#64748b' },
}

import { createClient } from '@supabase/supabase-js'
import type { Todo, Staff } from './types'

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL     ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── TODO CRUD ────────────────────────────────────────────────

export async function fetchTodos(): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('todos')
    .select('*, attachments(*)')
    .order('deadline', { ascending: true })
  if (error) throw error
  return (data ?? []) as Todo[]
}

export async function createTodo(
  todo: Omit<Todo, 'id' | 'created_at' | 'updated_at'>,
): Promise<Todo> {
  // attachments は別テーブルのため insert から除外
  const { attachments: _att, ...todoData } = todo
  const { data, error } = await supabase
    .from('todos')
    .insert(todoData)
    .select()
    .single()
  if (error) throw error
  return { ...data, attachments: [] } as Todo
}

export async function updateTodo(
  id: string,
  updates: Partial<Todo>,
): Promise<Todo> {
  const { attachments: _att, ...updateData } = updates as Partial<Todo> & { attachments?: unknown }
  const { data, error } = await supabase
    .from('todos')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, attachments(*)')
    .single()
  if (error) throw error
  return data as Todo
}

export async function deleteTodo(id: string): Promise<void> {
  const { error } = await supabase.from('todos').delete().eq('id', id)
  if (error) throw error
}

// ── STAFF CRUD ───────────────────────────────────────────────

export async function fetchStaff(): Promise<Staff[]> {
  const { data, error } = await supabase
    .from('staff')
    .select('id, name, color, initial')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Staff[]
}

export async function addStaffToDB(staff: Staff): Promise<void> {
  const { error } = await supabase.from('staff').insert(staff)
  if (error) throw error
}

export async function updateStaffInDB(
  id: string,
  updates: Partial<Omit<Staff, 'id'>>,
): Promise<void> {
  const { error } = await supabase.from('staff').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteStaffFromDB(id: string): Promise<void> {
  const { error } = await supabase.from('staff').delete().eq('id', id)
  if (error) throw error
}

import { createClient } from '@supabase/supabase-js'
import type { Todo, Staff } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── TODO CRUD ──────────────────────────────────────────────
export async function fetchTodos(): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('todos')
    .select('*, attachments(*)')
    .order('deadline', { ascending: true })
  if (error) throw error
  return data as Todo[]
}

export async function createTodo(todo: Omit<Todo, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.from('todos').insert(todo).select().single()
  if (error) throw error
  return data
}

export async function updateTodo(id: string, updates: Partial<Todo>) {
  const { data, error } = await supabase
    .from('todos')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTodo(id: string) {
  const { error } = await supabase.from('todos').delete().eq('id', id)
  if (error) throw error
}

// ── STAFF ──────────────────────────────────────────────────
export async function fetchStaff(): Promise<Staff[]> {
  const { data, error } = await supabase.from('staff').select('*').order('created_at')
  if (error) throw error
  return data as Staff[]
}

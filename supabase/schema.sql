-- ============================================================
-- 行政書士法人榊原・箭内事務所 TODO管理システム
-- Supabase Schema (PostgreSQL)
-- ============================================================

-- ── staff テーブル ──────────────────────────────────────────
create table if not exists public.staff (
  id          text primary key,         -- 'sakaki', 'yanai', etc.
  name        text not null,
  color       text not null default '#0d9488',
  initial     text not null,
  created_at  timestamptz default now()
);

-- 初期データ
insert into public.staff (id, name, color, initial) values
  ('tatsumoto', '立本', '#7c3aed', '立'),
  ('kaneko',    '金子', '#2563eb', '金'),
  ('sakaki',    '榊原', '#dc2626', '榊')
on conflict (id) do nothing;

-- ── todos テーブル ──────────────────────────────────────────
create table if not exists public.todos (
  id          uuid primary key default gen_random_uuid(),
  link_no     text,
  title       text not null,
  detail      text,
  task        text,
  staff_id    text references public.staff(id),
  status      text not null default 'todo'
                check (status in ('overdue','todo','doing','done')),
  priority    text not null default '中'
                check (priority in ('高','中','低')),
  tags        text[] default '{}',
  deadline    text,          -- 'YYYY/MM/DD'
  start_time  text,          -- 'HH:mm'
  end_time    text,          -- 'HH:mm'
  comment     text default '',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── attachments テーブル ────────────────────────────────────
create table if not exists public.attachments (
  id          uuid primary key default gen_random_uuid(),
  todo_id     uuid references public.todos(id) on delete cascade,
  name        text not null,
  type        text default 'pdf' check (type in ('pdf','xlsx','doc')),
  url         text,
  created_at  timestamptz default now()
);

-- ── Row Level Security (RLS) ────────────────────────────────
-- 本番では認証に合わせてポリシーを設定してください
alter table public.todos       enable row level security;
alter table public.staff       enable row level security;
alter table public.attachments enable row level security;

-- 開発用: 全員読み書き可能（本番前に変更してください）
create policy "allow_all_todos" on public.todos
  for all using (true) with check (true);

create policy "allow_all_staff" on public.staff
  for all using (true) with check (true);

create policy "allow_all_attachments" on public.attachments
  for all using (true) with check (true);

-- ── updated_at 自動更新 trigger ─────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger todos_updated_at
  before update on public.todos
  for each row execute function public.set_updated_at();

-- ── インデックス ────────────────────────────────────────────
create index if not exists todos_status_idx    on public.todos(status);
create index if not exists todos_staff_idx     on public.todos(staff_id);
create index if not exists todos_deadline_idx  on public.todos(deadline);
create index if not exists attachments_todo_idx on public.attachments(todo_id);

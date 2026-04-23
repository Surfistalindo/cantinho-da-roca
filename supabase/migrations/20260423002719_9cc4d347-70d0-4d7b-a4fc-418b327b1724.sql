
create table public.ia_import_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  source text not null,
  filename text,
  total_rows int not null default 0,
  created_count int not null default 0,
  updated_count int not null default 0,
  skipped_count int not null default 0,
  error_count int not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.ia_import_logs enable row level security;

create policy "Users can view own import logs"
  on public.ia_import_logs for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own import logs"
  on public.ia_import_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own import logs"
  on public.ia_import_logs for update
  to authenticated
  using (auth.uid() = user_id);

create index idx_ia_import_logs_user_started on public.ia_import_logs(user_id, started_at desc);

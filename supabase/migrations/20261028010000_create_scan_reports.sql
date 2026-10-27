create table if not exists public.scan_reports (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('url', 'message')),
  input text not null check (char_length(input) between 1 and 10000),
  label text not null check (char_length(label) between 1 and 200),
  created_at timestamptz not null,
  score integer not null check (score between 0 and 100),
  level text not null check (level in ('low', 'caution', 'high')),
  summary text not null,
  findings jsonb not null default '[]'::jsonb check (jsonb_typeof(findings) = 'array'),
  unverified jsonb not null default '[]'::jsonb check (jsonb_typeof(unverified) = 'array'),
  saved boolean not null default false
);

create index if not exists scan_reports_user_created_idx
  on public.scan_reports (user_id, created_at desc);

alter table public.scan_reports enable row level security;
revoke all on table public.scan_reports from anon, authenticated;
grant select, insert, update, delete on table public.scan_reports to authenticated;

drop policy if exists "Users can read their scan reports" on public.scan_reports;
create policy "Users can read their scan reports"
  on public.scan_reports for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their scan reports" on public.scan_reports;
create policy "Users can create their scan reports"
  on public.scan_reports for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their scan reports" on public.scan_reports;
create policy "Users can update their scan reports"
  on public.scan_reports for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their scan reports" on public.scan_reports;
create policy "Users can delete their scan reports"
  on public.scan_reports for delete to authenticated
  using ((select auth.uid()) = user_id);

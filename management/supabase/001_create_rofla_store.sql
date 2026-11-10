-- ROFLA shared cloud database (single shop, shared login)
-- Run this once in Supabase SQL Editor.
create table if not exists public.rofla_store (
  id smallint primary key check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.rofla_store enable row level security;

revoke all on table public.rofla_store from anon, public;
grant select, insert, update on table public.rofla_store to authenticated;

drop policy if exists "ROFLA shared account can read" on public.rofla_store;
create policy "ROFLA shared account can read"
on public.rofla_store for select to authenticated
using (true);

drop policy if exists "ROFLA shared account can create" on public.rofla_store;
create policy "ROFLA shared account can create"
on public.rofla_store for insert to authenticated
with check (id = 1 and updated_by = auth.uid());

drop policy if exists "ROFLA shared account can update" on public.rofla_store;
create policy "ROFLA shared account can update"
on public.rofla_store for update to authenticated
using (id = 1)
with check (id = 1 and updated_by = auth.uid());

insert into public.rofla_store (id, data)
values (1, '{}'::jsonb)
on conflict (id) do nothing;

-- Verify table and initial row
select id, jsonb_typeof(data) as data_type, updated_at
from public.rofla_store;

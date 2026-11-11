-- ROFLA security hardening v3
-- Run once in Supabase SQL Editor after 002_secure_sync.sql.
-- Keep authenticated read access limited by the owner-only RLS policy from v2.
revoke all on table public.rofla_store from anon, public;
revoke insert, update, delete, truncate, references, trigger
  on table public.rofla_store from authenticated;
grant select on table public.rofla_store to authenticated;

create or replace function public.save_rofla_data(p_data jsonb, p_expected_revision bigint)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  current_revision bigint;
begin
  if auth.uid() is null
     or lower(coalesce(auth.jwt()->>'email','')) <> 'ibrahimmandor@icloud.com' then
    raise exception 'ROFLA_ACCESS_DENIED';
  end if;

  if p_data is null or jsonb_typeof(p_data) <> 'object' then
    raise exception 'ROFLA_INVALID_PAYLOAD';
  end if;

  if pg_column_size(p_data) > 8388608 then
    raise exception 'ROFLA_PAYLOAD_TOO_LARGE';
  end if;

  select revision into current_revision
  from public.rofla_store
  where id = 1
  for update;

  if current_revision is null then
    raise exception 'ROFLA_STORE_MISSING';
  end if;

  if current_revision <> p_expected_revision then
    raise exception 'ROFLA_CONFLICT';
  end if;

  update public.rofla_store
  set data = p_data,
      revision = current_revision + 1,
      updated_at = now(),
      updated_by = auth.uid()
  where id = 1;

  return current_revision + 1;
end;
$$;

revoke all on function public.save_rofla_data(jsonb, bigint) from public, anon;
grant execute on function public.save_rofla_data(jsonb, bigint) to authenticated;

-- Verification: the row should exist and RLS should remain enabled.
select c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'rofla_store';

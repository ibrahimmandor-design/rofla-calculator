-- ROFLA cloud sync migration v2
alter table public.rofla_store
  add column if not exists revision bigint not null default 0;

drop policy if exists "ROFLA shared account can read" on public.rofla_store;
drop policy if exists "ROFLA shared account can create" on public.rofla_store;
drop policy if exists "ROFLA shared account can update" on public.rofla_store;

create policy "ROFLA owner can read"
on public.rofla_store for select to authenticated
using (lower(coalesce(auth.jwt()->>'email','')) = 'ibrahimmandor@icloud.com');

create or replace function public.save_rofla_data(p_data jsonb, p_expected_revision bigint)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare current_revision bigint;
begin
  if lower(coalesce(auth.jwt()->>'email','')) <> 'ibrahimmandor@icloud.com' then
    raise exception 'ROFLA_ACCESS_DENIED';
  end if;
  select revision into current_revision
  from public.rofla_store where id=1 for update;
  if current_revision is null then
    raise exception 'ROFLA_STORE_MISSING';
  end if;
  if current_revision <> p_expected_revision then
    raise exception 'ROFLA_CONFLICT';
  end if;
  update public.rofla_store
  set data=p_data, revision=current_revision+1,
      updated_at=now(), updated_by=auth.uid()
  where id=1;
  return current_revision+1;
end;
$$;

revoke all on function public.save_rofla_data(jsonb,bigint) from public, anon;
grant execute on function public.save_rofla_data(jsonb,bigint) to authenticated;

-- Return current version for the signed-in owner
select id, revision, jsonb_typeof(data) as data_type, updated_at
from public.rofla_store
where id=1;

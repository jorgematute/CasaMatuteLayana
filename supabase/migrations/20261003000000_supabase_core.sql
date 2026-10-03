do $$
begin
  if to_regclass('public.users') is null and to_regclass('public.profiles') is not null then
    alter table public.profiles rename to users;
  end if;
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  is_household_member boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;

drop policy if exists "Users can read their own profile" on public.users;
create policy "Users can read their own profile"
  on public.users for select to authenticated
  using ((select auth.uid()) = id);

revoke all on public.users from anon;
grant select on public.users to authenticated;

create or replace function public.handle_auth_user_sync()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
drop trigger if exists on_auth_user_synced on auth.users;
create trigger on_auth_user_synced
  after insert or update of email on auth.users
  for each row execute procedure public.handle_auth_user_sync();

insert into public.users (id, email, full_name)
select id, email, coalesce(raw_user_meta_data ->> 'full_name', '')
from auth.users
on conflict (id) do nothing;

create table if not exists public.app_records (
  collection text not null check (collection ~ '^[a-z0-9-]+$'),
  id text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);

create index if not exists app_records_collection_updated_at_idx
  on public.app_records (collection, updated_at desc);

alter table public.app_records enable row level security;

drop policy if exists "Authenticated household members can access records" on public.app_records;
create policy "Authenticated household members can access records"
  on public.app_records for all to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = (select auth.uid())
        and users.is_household_member
    )
  )
  with check (
    exists (
      select 1 from public.users
      where users.id = (select auth.uid())
        and users.is_household_member
    )
  );

revoke all on public.app_records from anon;
grant select, insert, update, delete on public.app_records to authenticated;

insert into public.app_records (collection, id, data, created_at, updated_at)
values (
  'example',
  'ex_001',
  '{"name":"Registro de prueba","active":true}'::jsonb,
  '2026-09-12T00:00:00Z',
  '2026-09-12T00:00:00Z'
)
on conflict (collection, id) do nothing;
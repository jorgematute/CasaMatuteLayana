alter table public.users
  add column if not exists is_admin boolean not null default false;

create index if not exists users_admin_lookup_idx
  on public.users (is_admin) where is_admin;
-- Correctif RLS Vie de groupe.
-- À lancer dans Supabase SQL Editor si ajout/suppression matériel, tir ou habilitation affiche :
-- new row violates row-level security policy for table "vie_groupe_options"

create or replace function public.app_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.users
  where auth_email = auth.jwt() ->> 'email'
     or username = split_part(auth.jwt() ->> 'email', '@', 1)
     or username = split_part(split_part(auth.jwt() ->> 'email', '@', 1), '_', 1)
     or (
       auth.jwt() ->> 'email' = 'tayeb.berkouk.tbt@gmail.com'
       and username = 'tolier'
     )
  order by
    case
      when auth_email = auth.jwt() ->> 'email' then 0
      when username = 'tolier' then 1
      else 2
    end
  limit 1
$$;

create or replace function public.app_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.app_user_role() in ('LE TÔLIER', 'ADMINISTRATEUR'), false)
$$;

alter table if exists public.vie_groupe_options enable row level security;
alter table if exists public.vie_groupe_dossiers enable row level security;

drop policy if exists "vie_groupe_options_insert_authenticated" on public.vie_groupe_options;
drop policy if exists "vie_groupe_options_update_authenticated" on public.vie_groupe_options;
drop policy if exists "vie_groupe_options_delete_authenticated" on public.vie_groupe_options;
drop policy if exists "vie_groupe_options_admin_all" on public.vie_groupe_options;
drop policy if exists "vie_groupe_options_admin_insert" on public.vie_groupe_options;
drop policy if exists "vie_groupe_options_admin_update" on public.vie_groupe_options;
drop policy if exists "vie_groupe_options_admin_delete" on public.vie_groupe_options;

create policy "vie_groupe_options_admin_insert"
on public.vie_groupe_options
for insert
with check (public.app_is_admin());

create policy "vie_groupe_options_admin_update"
on public.vie_groupe_options
for update
using (public.app_is_admin())
with check (public.app_is_admin());

create policy "vie_groupe_options_admin_delete"
on public.vie_groupe_options
for delete
using (public.app_is_admin());

drop policy if exists "vie_groupe_dossiers_delete_admin" on public.vie_groupe_dossiers;
create policy "vie_groupe_dossiers_delete_admin"
on public.vie_groupe_dossiers
for delete
using (public.app_is_admin());

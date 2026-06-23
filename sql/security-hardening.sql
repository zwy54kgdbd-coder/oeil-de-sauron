-- Sécurité Supabase - durcissement progressif.
-- À lancer dans Supabase SQL Editor.
-- Objectif : garder la lecture/ajout/modification utilisable, mais limiter les suppressions
-- et les actions sensibles aux rôles LE TÔLIER / ADMINISTRATEUR quand la table le permet.

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

create or replace function public.app_is_tolier()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.app_user_role() = 'LE TÔLIER', false)
$$;

alter table if exists public.camps enable row level security;
alter table if exists public.numeros_utiles enable row level security;
alter table if exists public.vie_groupe enable row level security;
alter table if exists public.vie_groupe_dossiers enable row level security;
alter table if exists public.vie_groupe_options enable row level security;
alter table if exists public.caisse_cafe_rappels enable row level security;

-- On retire les anciennes policies trop larges sur les actions sensibles.
drop policy if exists "numeros_utiles_delete_authenticated" on public.numeros_utiles;
drop policy if exists "vie_groupe_options_insert_authenticated" on public.vie_groupe_options;
drop policy if exists "vie_groupe_options_update_authenticated" on public.vie_groupe_options;
drop policy if exists "vie_groupe_options_delete_authenticated" on public.vie_groupe_options;
drop policy if exists "caisse_cafe_rappels_insert_authenticated" on public.caisse_cafe_rappels;
drop policy if exists "caisse_cafe_rappels_update_authenticated" on public.caisse_cafe_rappels;
drop policy if exists "caisse_cafe_rappels_delete_authenticated" on public.caisse_cafe_rappels;

drop policy if exists "camps_delete_admin" on public.camps;
create policy "camps_delete_admin"
on public.camps
for delete
using (public.app_is_admin());

drop policy if exists "numeros_utiles_delete_admin" on public.numeros_utiles;
create policy "numeros_utiles_delete_admin"
on public.numeros_utiles
for delete
using (public.app_is_admin());

drop policy if exists "vie_groupe_delete_owner_admin" on public.vie_groupe;
create policy "vie_groupe_delete_owner_admin"
on public.vie_groupe
for delete
using (
  public.app_is_admin()
  or created_by = split_part(auth.jwt() ->> 'email', '@', 1)
);

drop policy if exists "vie_groupe_dossiers_delete_admin" on public.vie_groupe_dossiers;
create policy "vie_groupe_dossiers_delete_admin"
on public.vie_groupe_dossiers
for delete
using (public.app_is_admin());

drop policy if exists "vie_groupe_options_admin_all" on public.vie_groupe_options;
drop policy if exists "vie_groupe_options_admin_insert" on public.vie_groupe_options;
create policy "vie_groupe_options_admin_insert"
on public.vie_groupe_options
for insert
with check (public.app_is_admin());

drop policy if exists "vie_groupe_options_admin_update" on public.vie_groupe_options;
create policy "vie_groupe_options_admin_update"
on public.vie_groupe_options
for update
using (public.app_is_admin())
with check (public.app_is_admin());

drop policy if exists "vie_groupe_options_admin_delete" on public.vie_groupe_options;
create policy "vie_groupe_options_admin_delete"
on public.vie_groupe_options
for delete
using (public.app_is_admin());

drop policy if exists "caisse_cafe_rappels_admin_all" on public.caisse_cafe_rappels;
drop policy if exists "caisse_cafe_rappels_admin_insert" on public.caisse_cafe_rappels;
create policy "caisse_cafe_rappels_admin_insert"
on public.caisse_cafe_rappels
for insert
with check (public.app_is_admin());

drop policy if exists "caisse_cafe_rappels_admin_update" on public.caisse_cafe_rappels;
create policy "caisse_cafe_rappels_admin_update"
on public.caisse_cafe_rappels
for update
using (public.app_is_admin())
with check (public.app_is_admin());

drop policy if exists "caisse_cafe_rappels_admin_delete" on public.caisse_cafe_rappels;
create policy "caisse_cafe_rappels_admin_delete"
on public.caisse_cafe_rappels
for delete
using (public.app_is_admin());

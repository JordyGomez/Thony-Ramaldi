-- Editor completo de la web. Migración aditiva e idempotente.
-- Ejecutar en SQL Editor del proyecto existente. No borra propiedades ni usuarios.
begin;

create table if not exists public.site_content (
  id smallint primary key check (id = 1),
  content jsonb not null default '{}'::jsonb,
  revision integer not null default 0,
  published_at timestamptz,
  published_by uuid references auth.users(id) on delete set null
);
create table if not exists public.site_drafts (
  id smallint primary key check (id = 1),
  content jsonb not null default '{}'::jsonb,
  revision integer not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
create table if not exists public.site_revisions (
  revision integer primary key,
  content jsonb not null,
  published_at timestamptz not null default now(),
  published_by uuid references auth.users(id) on delete set null
);
insert into public.site_content (id) values (1) on conflict do nothing;
insert into public.site_drafts (id) values (1) on conflict do nothing;

alter table public.site_content enable row level security;
alter table public.site_drafts enable row level security;
alter table public.site_revisions enable row level security;
drop policy if exists "Leer configuración publicada" on public.site_content;
create policy "Leer configuración publicada" on public.site_content for select to anon, authenticated using (true);
drop policy if exists "Administradores leen borradores" on public.site_drafts;
create policy "Administradores leen borradores" on public.site_drafts for select to authenticated using (public.is_admin());
drop policy if exists "Administradores leen historial" on public.site_revisions;
create policy "Administradores leen historial" on public.site_revisions for select to authenticated using (public.is_admin());
revoke select on public.site_content from anon, authenticated;
grant select (id, content, revision, published_at) on public.site_content to anon, authenticated;
revoke all on public.site_drafts, public.site_revisions from anon;
grant select on public.site_drafts, public.site_revisions to authenticated;

-- Escritura atómica y control de versiones para dos colaboradores simultáneos.
create or replace function public.save_site_content(p_content jsonb, p_revision integer, p_publish boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  current_draft public.site_drafts%rowtype;
  current_publication public.site_content%rowtype;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Se requiere una cuenta administradora' using errcode = '42501';
  end if;
  if jsonb_typeof(p_content) <> 'object' or octet_length(p_content::text) > 65536 then
    raise exception 'Configuración no válida' using errcode = '22023';
  end if;
  select * into current_draft from public.site_drafts where id = 1 for update;
  select * into current_publication from public.site_content where id = 1 for update;
  if current_draft.id is null or current_publication.id is null then
    raise exception 'Faltan los registros de configuración' using errcode = '55000';
  end if;
  if p_revision is null or current_draft.revision <> p_revision then
    raise exception 'La edición cambió en otra sesión' using errcode = '40001';
  end if;
  update public.site_drafts set content = p_content, revision = revision + 1, updated_at = now(), updated_by = auth.uid() where id = 1;
  if p_publish then
    insert into public.site_revisions (revision, content, published_at, published_by)
      values (current_publication.revision, current_publication.content, coalesce(current_publication.published_at, now()), current_publication.published_by)
      on conflict (revision) do nothing;
    update public.site_content set content = p_content, revision = revision + 1, published_at = now(), published_by = auth.uid() where id = 1;
    current_publication.revision := current_publication.revision + 1;
    current_publication.published_at := now();
  end if;
  return jsonb_build_object('revision', current_draft.revision + 1, 'publishedRevision', current_publication.revision, 'publishedAt', current_publication.published_at);
end;
$$;
revoke all on function public.save_site_content(jsonb, integer, boolean) from public, anon;
grant execute on function public.save_site_content(jsonb, integer, boolean) to authenticated;

-- La biblioteca puede leer sus propios archivos. Las subidas siguen restringidas.
insert into storage.buckets (id, name, public) values ('properties', 'properties', true)
  on conflict (id) do update set public = true;
drop policy if exists "Administradores suben archivos" on storage.objects;
create policy "Administradores suben archivos" on storage.objects for insert to authenticated
  with check (bucket_id = 'properties' and public.is_admin());
drop policy if exists "Administradores reemplazan archivos" on storage.objects;
create policy "Administradores reemplazan archivos" on storage.objects for update to authenticated
  using (bucket_id = 'properties' and public.is_admin())
  with check (bucket_id = 'properties' and public.is_admin());
drop policy if exists "Administradores borran archivos" on storage.objects;
create policy "Administradores borran archivos" on storage.objects for delete to authenticated
  using (bucket_id = 'properties' and public.is_admin());
drop policy if exists "Administradores ven archivos" on storage.objects;
create policy "Administradores ven archivos" on storage.objects for select to authenticated
  using (bucket_id = 'properties' and public.is_admin());

commit;

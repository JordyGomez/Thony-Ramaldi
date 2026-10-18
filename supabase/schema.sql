-- Esquema del panel de propiedades de Thony Paulino · Ramaldi.
-- Ejecutar una sola vez en Supabase: SQL Editor → New query → pegar → Run.
-- Después, cambiar el correo de la última línea por el de quien administra.

-- Propiedades ---------------------------------------------------------------
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  reference text not null,
  title text not null,
  location text not null,
  neighborhood text not null default '',
  type text not null check (type in ('Apartamento', 'Villa', 'Penthouse')),
  operation text not null check (operation in ('Venta', 'Alquiler')),
  price numeric not null check (price >= 0),
  price_provisional boolean not null default false,
  bedrooms integer check (bedrooms >= 0),
  bathrooms numeric check (bathrooms >= 0),
  area numeric check (area >= 0),
  parking integer check (parking >= 0),
  description text not null default '',
  amenities text[] not null default '{}',
  -- Lista ordenada de fotos: [{ "path": "carpeta/foto.jpg", "alt": "Descripción" }]
  images jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  demo boolean not null default false,
  in_preparation boolean not null default false,
  images_are_renders boolean not null default false,
  project_name text,
  project_facts text[],
  project_typologies text[],
  confirmation_note text,
  brochure_path text,
  brochure_label text,
  sort_order integer,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists properties_touch on public.properties;
create trigger properties_touch before update on public.properties
  for each row execute function public.touch_updated_at();

-- Administradores ------------------------------------------------------------
-- Solo los correos de esta tabla pueden crear, editar o borrar. La tabla no
-- tiene políticas: no se puede leer ni modificar desde la web.
create table if not exists public.admin_users (
  email text primary key
);
alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_users
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

-- Seguridad de las propiedades -------------------------------------------------
alter table public.properties enable row level security;

drop policy if exists "Lectura pública de publicadas" on public.properties;
create policy "Lectura pública de publicadas" on public.properties
  for select using (published or public.is_admin());

drop policy if exists "Administradores crean" on public.properties;
create policy "Administradores crean" on public.properties
  for insert to authenticated with check (public.is_admin());

drop policy if exists "Administradores editan" on public.properties;
create policy "Administradores editan" on public.properties
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Administradores borran" on public.properties;
create policy "Administradores borran" on public.properties
  for delete to authenticated using (public.is_admin());

-- Fotos y folletos -----------------------------------------------------------
-- Bucket público de lectura; solo administradores suben o borran.
insert into storage.buckets (id, name, public)
values ('properties', 'properties', true)
on conflict (id) do update set public = true;

drop policy if exists "Administradores suben archivos" on storage.objects;
create policy "Administradores suben archivos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'properties' and public.is_admin());

drop policy if exists "Administradores reemplazan archivos" on storage.objects;
create policy "Administradores reemplazan archivos" on storage.objects
  for update to authenticated
  using (bucket_id = 'properties' and public.is_admin());

drop policy if exists "Administradores borran archivos" on storage.objects;
create policy "Administradores borran archivos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'properties' and public.is_admin());

-- Cambiar por el correo real de Thony (y añadir más filas si hace falta).
insert into public.admin_users (email) values ('correo-de-thony@ejemplo.com')
on conflict do nothing;

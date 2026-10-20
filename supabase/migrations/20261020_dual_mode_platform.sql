-- AMPLIACIÓN ADITIVA. Requiere schema.sql y 20261018_site_editor.sql.
-- No ejecutar sin comparar el esquema/políticas reales y disponer de respaldo.
-- No asigna inventario legado a una organización ni concede SUPERADMIN.
begin;

create table if not exists public.platform_superadmins (
  user_id uuid primary key references auth.users(id) on delete restrict,
  granted_at timestamptz not null default now()
);
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null default 'Ramaldi Inmobiliaria',
  authorization_reference text,
  authorized_at timestamptz,
  authorized_by uuid references auth.users(id) on delete restrict,
  registration_enabled boolean not null default false,
  created_at timestamptz not null default now()
);
insert into public.organizations (slug) values ('ramaldi') on conflict do nothing;
create table if not exists public.platform_state (
  id smallint primary key check (id = 1),
  active_mode text not null default 'thony' check (active_mode in ('thony','ramaldi')),
  revision integer not null default 0,
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users(id) on delete restrict
);
insert into public.platform_state (id) values (1) on conflict do nothing;
create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  role text not null default 'agent' check (role in ('agent','business_admin')),
  status text not null default 'pending' check (status in ('pending','active','suspended','rejected')),
  application jsonb not null default '{}',
  reviewer_note text not null default '',
  revision integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id,user_id)
);
create table if not exists public.membership_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  email text not null check (email = lower(email) and length(email) <= 254),
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  revoked_at timestamptz,
  invited_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);
create table if not exists public.agent_profiles (
  organization_id uuid not null,
  user_id uuid not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  draft jsonb not null default '{}',
  published_content jsonb,
  published_slug text,
  public_enabled boolean not null default false,
  status text not null default 'draft' check (status in ('draft','pending','corrections','published','hidden','rejected')),
  reviewer_note text not null default '',
  revision integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (organization_id,user_id),
  foreign key (organization_id,user_id) references public.organization_members(organization_id,user_id) on delete restrict
);
create table if not exists public.site_mode_settings (
  mode text primary key check (mode = 'ramaldi'),
  draft jsonb not null default '{}',
  published_content jsonb,
  revision integer not null default 0,
  published_revision integer not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete restrict
);
alter table public.agent_profiles add column if not exists published_slug text;
alter table public.agent_profiles add column if not exists public_enabled boolean not null default false;
create unique index if not exists agent_profiles_published_slug on public.agent_profiles(published_slug) where published_slug is not null;
insert into public.site_mode_settings (mode) values ('ramaldi') on conflict do nothing;
create table if not exists public.site_mode_revisions (
  mode text not null references public.site_mode_settings(mode),
  revision integer not null,
  content jsonb not null,
  published_at timestamptz not null default now(),
  published_by uuid references auth.users(id) on delete restrict,
  primary key (mode,revision)
);
create table if not exists public.platform_audit (
  id bigint generated always as identity primary key,
  event text not null,
  actor_id uuid not null references auth.users(id) on delete restrict,
  organization_id uuid references public.organizations(id) on delete restrict,
  subject_id uuid,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create table if not exists public.mode_change_audit (
  id bigint generated always as identity primary key,
  actor_id uuid not null references auth.users(id) on delete restrict,
  previous_mode text not null,
  new_mode text not null,
  revision integer not null unique,
  property_count integer not null,
  authorization_reference text,
  created_at timestamptz not null default now()
);

-- Las columnas nuevas no atribuyen la propiedad de datos antiguos.
alter table public.properties add column if not exists organization_id uuid references public.organizations(id) on delete restrict;
alter table public.properties add column if not exists agent_id uuid references auth.users(id) on delete restrict;
alter table public.properties add column if not exists workflow_state text;
alter table public.properties add column if not exists thony_visible boolean not null default true;
alter table public.properties add column if not exists ramaldi_visible boolean not null default false;
alter table public.properties add column if not exists version integer not null default 0;
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid='public.properties'::regclass and conname='properties_enterprise_integrity') then
    alter table public.properties add constraint properties_enterprise_integrity check (
      (organization_id is null and agent_id is null and workflow_state is null and not ramaldi_visible)
      or (organization_id is not null and agent_id is not null and workflow_state is not null and workflow_state in
        ('draft','pending','corrections','approved','published','hidden','rejected','sold','rented')
        and (not published or workflow_state='published'))
    );
    alter table public.properties add constraint properties_member_fk foreign key (organization_id,agent_id)
      references public.organization_members(organization_id,user_id) on delete restrict;
  end if;
end $$;
create index if not exists properties_organization_agent on public.properties(organization_id,agent_id);
create table if not exists public.publication_approvals (
  id bigint generated always as identity primary key,
  property_id uuid not null references public.properties(id) on delete restrict,
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  note text not null default '',
  property_version integer not null,
  created_at timestamptz not null default now()
);
create table if not exists public.property_documents (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  owner_id uuid not null references auth.users(id) on delete restrict,
  path text not null,
  label text not null check(length(label) between 3 and 160),
  kind text not null check(kind in ('plan','document')),
  public_on_publication boolean not null default false,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  check(not public_on_publication or kind='plan')
);

create or replace function public.is_platform_superadmin()
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select auth.uid() is not null and exists(select 1 from public.platform_superadmins s join auth.users u on u.id=s.user_id where s.user_id=auth.uid() and u.email_confirmed_at is not null);
$$;
create or replace function public.platform_verified_user()
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select auth.uid() is not null and exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null);
$$;
create or replace function public.is_organization_admin(p_org uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select public.is_platform_superadmin() or (public.platform_verified_user() and exists(
    select 1 from public.organization_members where organization_id=p_org and user_id=auth.uid() and role='business_admin' and status='active'));
$$;
create or replace function public.is_active_agent(p_org uuid,p_user uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select exists(select 1 from public.organization_members m join auth.users u on u.id=m.user_id
    where m.organization_id=p_org and m.user_id=p_user and m.status='active' and u.email_confirmed_at is not null);
$$;
create or replace function public.enterprise_enabled()
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select exists(select 1 from public.platform_state s,public.organizations o
    where s.id=1 and s.active_mode='ramaldi' and o.slug='ramaldi' and o.authorized_at is not null);
$$;
create or replace function public.agent_publication_ready(p_org uuid,p_user uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select public.is_active_agent(p_org,p_user) and exists(select 1 from public.agent_profiles where organization_id=p_org and user_id=p_user and public_enabled and published_content is not null);
$$;
create or replace function public.can_work_in_organization(p_org uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select public.is_organization_admin(p_org) or (public.enterprise_enabled() and public.is_active_agent(p_org,auth.uid()));
$$;
create or replace function public.platform_log(p_event text,p_org uuid,p_subject uuid,p_details jsonb default '{}')
returns void language sql security definer set search_path=public,pg_temp as $$
  insert into public.platform_audit(event,actor_id,organization_id,subject_id,details) values(p_event,auth.uid(),p_org,p_subject,p_details);
$$;
revoke all on function public.platform_log(text,uuid,uuid,jsonb) from public,anon,authenticated;
create or replace function public.audit_personal_property_delete()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if old.organization_id is null and auth.uid() is not null then
    perform public.platform_log('property_deleted',null,old.id,jsonb_build_object('source','personal','slug',old.slug));
  end if;
  return old;
end $$;
revoke all on function public.audit_personal_property_delete() from public,anon,authenticated;
drop trigger if exists personal_property_delete_audit on public.properties;
create trigger personal_property_delete_audit after delete on public.properties for each row execute function public.audit_personal_property_delete();

-- Ninguna tabla privada admite DML directo desde clientes, ni siquiera superadmin.
do $$ declare n text; begin
  foreach n in array array['platform_superadmins','organizations','platform_state','organization_members','membership_invitations','agent_profiles','site_mode_settings','site_mode_revisions','platform_audit','mode_change_audit','publication_approvals','property_documents'] loop
    execute format('alter table public.%I enable row level security',n);
    execute format('revoke all on public.%I from anon,authenticated',n);
    execute format('grant select on public.%I to authenticated',n);
  end loop;
end $$;
drop policy if exists platform_superadmins_read on public.platform_superadmins;
create policy platform_superadmins_read on public.platform_superadmins for select to authenticated using (public.is_platform_superadmin());
drop policy if exists organizations_read on public.organizations;
create policy organizations_read on public.organizations for select to authenticated using (public.is_organization_admin(id));
drop policy if exists platform_state_read on public.platform_state;
create policy platform_state_read on public.platform_state for select to anon,authenticated using (true);
revoke select on public.platform_state from anon,authenticated;
grant select (id,active_mode,revision) on public.platform_state to anon,authenticated;
drop policy if exists members_read on public.organization_members;
create policy members_read on public.organization_members for select to authenticated using (user_id=auth.uid() or public.is_organization_admin(organization_id));
drop policy if exists invitations_read on public.membership_invitations;
create policy invitations_read on public.membership_invitations for select to authenticated using (public.is_organization_admin(organization_id));
drop policy if exists profiles_read on public.agent_profiles;
create policy profiles_read on public.agent_profiles for select to authenticated using ((user_id=auth.uid() and public.can_work_in_organization(organization_id)) or public.is_organization_admin(organization_id));
drop policy if exists mode_settings_read on public.site_mode_settings;
create policy mode_settings_read on public.site_mode_settings for select to authenticated using (public.is_organization_admin((select id from public.organizations where slug='ramaldi')));
drop policy if exists mode_revisions_read on public.site_mode_revisions;
create policy mode_revisions_read on public.site_mode_revisions for select to authenticated using (public.is_organization_admin((select id from public.organizations where slug='ramaldi')));
drop policy if exists platform_audit_read on public.platform_audit;
create policy platform_audit_read on public.platform_audit for select to authenticated using (public.is_platform_superadmin() or public.is_organization_admin(organization_id));
drop policy if exists mode_audit_read on public.mode_change_audit;
create policy mode_audit_read on public.mode_change_audit for select to authenticated using (public.is_platform_superadmin());
drop policy if exists approvals_read on public.publication_approvals;
create policy approvals_read on public.publication_approvals for select to authenticated using (exists(
  select 1 from public.properties p where p.id=property_id and public.can_work_in_organization(p.organization_id)
    and (p.agent_id=auth.uid() or public.is_organization_admin(p.organization_id))));
drop policy if exists property_documents_read on public.property_documents;
create policy property_documents_read on public.property_documents for select to authenticated using (
  public.is_organization_admin(organization_id) or (owner_id=auth.uid() and public.can_work_in_organization(organization_id)));

-- La política antigua era permisiva para cualquier publicada. Sustituir SOLO las
-- políticas versionadas; inspeccionar políticas adicionales antes de instalar.
-- Solo modo y versión son públicos. Identidad del operador y fechas, por RPC privada.
create or replace function public.active_site_mode()
returns text language sql stable security definer set search_path=public,pg_temp as $$ select active_mode from public.platform_state where id=1 $$;
create or replace function public.is_ramaldi_organization(p_org uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select exists(select 1 from public.organizations where id=p_org and slug='ramaldi');
$$;
revoke all on function public.is_ramaldi_organization(uuid) from public;
grant execute on function public.is_ramaldi_organization(uuid) to anon,authenticated;
drop policy if exists "Lectura pública de publicadas" on public.properties;
create policy "Lectura pública de publicadas" on public.properties for select using (
  (organization_id is null and ((published and not demo and thony_visible and public.active_site_mode()='thony') or public.is_admin()))
  or (organization_id is not null and (public.is_organization_admin(organization_id)
    or (agent_id=auth.uid() and public.can_work_in_organization(organization_id))
    or (published and not demo and not price_provisional and workflow_state='published' and public.agent_publication_ready(organization_id,agent_id)
      and ((public.enterprise_enabled() and ramaldi_visible) or (public.active_site_mode()='thony' and thony_visible)))))
);
-- Un permiso permisivo antiguo adicional no debe exponer fichas empresariales.
drop policy if exists properties_visibility_fence on public.properties;
create policy properties_visibility_fence on public.properties as restrictive for select to anon,authenticated using (
  (organization_id is null and ((published and not demo and thony_visible and public.active_site_mode()='thony') or public.is_admin()))
  or (organization_id is not null and (public.is_organization_admin(organization_id)
    or (agent_id=auth.uid() and public.can_work_in_organization(organization_id))
    or (published and not demo and not price_provisional and workflow_state='published' and public.agent_publication_ready(organization_id,agent_id)
      and ((public.enterprise_enabled() and public.is_ramaldi_organization(organization_id) and ramaldi_visible) or (public.active_site_mode()='thony' and thony_visible)))))
);
drop policy if exists "Administradores crean" on public.properties;
create policy "Administradores crean" on public.properties for insert to authenticated with check (organization_id is null and public.is_admin());
drop policy if exists "Administradores editan" on public.properties;
create policy "Administradores editan" on public.properties for update to authenticated using (organization_id is null and public.is_admin()) with check (organization_id is null and public.is_admin());
drop policy if exists "Administradores borran" on public.properties;
create policy "Administradores borran" on public.properties for delete to authenticated using (organization_id is null and public.is_admin());
create or replace function public.guard_enterprise_property()
returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
  if current_user in ('anon','authenticated') and
    ((tg_op<>'INSERT' and old.organization_id is not null) or (tg_op<>'DELETE' and new.organization_id is not null)) then
    raise exception 'Usa el flujo empresarial autorizado' using errcode='42501';
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
drop trigger if exists properties_enterprise_guard on public.properties;
create trigger properties_enterprise_guard before insert or update or delete on public.properties for each row execute function public.guard_enterprise_property();

create or replace function public.platform_access()
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare o uuid; m public.organization_members%rowtype;
begin
  if auth.uid() is null then raise exception 'Sesión requerida' using errcode='42501'; end if;
  select id into o from public.organizations where slug='ramaldi';
  select * into m from public.organization_members where organization_id=o and user_id=auth.uid();
  return jsonb_build_object('superadmin',public.is_platform_superadmin(),'legacyAdmin',public.is_admin(),
    'organizationId',o,'role',m.role,'status',m.status,'revision',m.revision,'reviewerNote',m.reviewer_note,
    'enabled',public.enterprise_enabled(),'verified',public.platform_verified_user(),
    'canReview',public.is_organization_admin(o),'canWork',public.can_work_in_organization(o));
end $$;

create or replace function public.set_corporate_authorization(p_reference text,p_confirm boolean,p_registration boolean default false)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare o uuid;
begin
  if not public.is_platform_superadmin() or p_confirm is distinct from true or length(trim(p_reference)) not between 12 and 500 then
    raise exception 'Falta autorización empresarial verificable' using errcode='42501'; end if;
  select id into o from public.organizations where slug='ramaldi' for update;
  update public.organizations set authorization_reference=trim(p_reference),authorized_at=now(),authorized_by=auth.uid(),registration_enabled=p_registration where id=o;
  perform public.platform_log('corporate_authorization',o,null,jsonb_build_object('reference',p_reference,'registration',p_registration));
end $$;

create or replace function public.platform_text_fields_valid(p jsonb,p_keys text[])
returns boolean language sql immutable set search_path=public,pg_temp as $$
  select coalesce(jsonb_typeof(p)='object' and not exists(select 1 from jsonb_each(p) f
    where not(f.key=any(p_keys)) or jsonb_typeof(f.value)<>'string' or length(f.value#>>'{}')>case when f.key='description' then 3000 else 500 end),false);
$$;
create or replace function public.platform_contacts_valid(p jsonb)
returns boolean language sql immutable set search_path=public,pg_temp as $$
  select (coalesce(p->>'email','')='' or (p->>'email') ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
    and (coalesce(p->>'phone','')='' or (p->>'phone') ~ '^[0-9]{10,15}$')
    and (coalesce(p->>'whatsapp','')='' or (p->>'whatsapp') ~ '^[0-9]{10,15}$');
$$;
revoke all on function public.platform_text_fields_valid(jsonb,text[]),public.platform_contacts_valid(jsonb) from public,anon,authenticated;

create or replace function public.platform_color_luminance(p_color text)
returns double precision language sql immutable set search_path=public,pg_temp as $$
  select case when p_color ~ '^#[a-fA-F0-9]{6}$' then
    (select sum((case when n<=0.04045 then n/12.92 else power((n+0.055)/1.055,2.4) end)*weight)
      from (select get_byte(decode(substring(p_color from 2),'hex'),i)/255.0 as n,weight from (values(0,0.2126),(1,0.7152),(2,0.0722)) c(i,weight)) channels)
    else null end;
$$;
create or replace function public.enterprise_theme_valid(p jsonb)
returns boolean language sql immutable set search_path=public,pg_temp as $$
  select coalesce(bg<=0.15 and (greatest(bg,fg)+0.05)/(least(bg,fg)+0.05)>=7 and (greatest(bg,accent)+0.05)/(least(bg,accent)+0.05)>=4.5,false)
  from (select public.platform_color_luminance(coalesce(p->>'background','#2B2B2B')) bg,public.platform_color_luminance(coalesce(p->>'text','#FFFFFF')) fg,public.platform_color_luminance(coalesce(p->>'accent','#F5E8B3')) accent) colors;
$$;
revoke all on function public.platform_color_luminance(text),public.enterprise_theme_valid(jsonb) from public,anon,authenticated;
create or replace function public.enterprise_settings_ready(p_content jsonb)
returns boolean language sql immutable as $$
  select coalesce(jsonb_typeof(p_content)='object' and
    length(p_content->>'name') between 3 and 80 and length(p_content->>'headline') between 3 and 120 and
    length(p_content->>'description') between 10 and 3000 and length(p_content->>'seoTitle') between 3 and 120 and
    length(p_content->>'seoDescription') between 10 and 320 and
    (p_content->>'hero') ~ '^platform/[a-f0-9-]+/[a-f0-9-]+/[a-f0-9-]+\.(jpg|jpeg|png|webp)$' and
    (p_content->>'logo') ~ '^platform/[a-f0-9-]+/[a-f0-9-]+/[a-f0-9-]+\.(jpg|jpeg|png|webp)$' and
    ((p_content->>'email') ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or (p_content->>'phone') ~ '^[0-9]{10,15}$') and public.enterprise_theme_valid(p_content),false);
$$;
create or replace function public.save_enterprise_settings(p_content jsonb,p_revision integer,p_publish boolean default false)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare o uuid; s public.site_mode_settings%rowtype;
begin
  select id into o from public.organizations where slug='ramaldi';
  if not public.is_organization_admin(o) then raise exception 'Permiso requerido' using errcode='42501'; end if;
  if p_content is null or jsonb_typeof(p_content)<>'object' or octet_length(p_content::text)>32768 then raise exception 'Configuración no válida' using errcode='22023'; end if;
  if not public.platform_text_fields_valid(p_content-'services',array['name','headline','description','hero','logo','email','phone','whatsapp','address','seoTitle','seoDescription','background','text','accent','navHome','navProperties','navAgents','navContact','navEmployees','navRegister'])
    or (p_content ? 'services' and (jsonb_typeof(p_content->'services')<>'array' or jsonb_array_length(p_content->'services')>12))
    or not public.platform_contacts_valid(p_content) then raise exception 'Campos empresariales no válidos' using errcode='22023'; end if;
  if p_content ? 'services' and exists(select 1 from jsonb_array_elements(p_content->'services') v where jsonb_typeof(v)<>'string' or length(v#>>'{}')>200) then raise exception 'Servicios no válidos' using errcode='22023'; end if;
  if not public.enterprise_theme_valid(p_content) or exists(select 1 from unnest(array['background','text','accent']) k where p_content ? k and (p_content->>k) !~ '^#[a-fA-F0-9]{6}$') then raise exception 'Colores no válidos' using errcode='22023'; end if;
  if exists(select 1 from unnest(array['navHome','navProperties','navAgents','navContact','navEmployees','navRegister']) k where p_content ? k and length(p_content->>k) not between 1 and 60) then raise exception 'Navegación no válida' using errcode='22023'; end if;
  if exists(select 1 from jsonb_each_text(p_content) a where a.key in ('hero','logo') and a.value<>'' and
    (a.value !~ '^platform/[a-f0-9-]{36}/[a-f0-9-]{36}/[a-f0-9-]{36}\.(jpg|jpeg|png|webp)$'
      or not exists(select 1 from storage.objects where bucket_id='platform-media' and name=substring(a.value from 10) and split_part(name,'/',1)=o::text))) then raise exception 'Recurso empresarial ajeno o no válido' using errcode='42501'; end if;
  if p_publish and not public.enterprise_settings_ready(p_content) then raise exception 'Faltan identidad, recursos y contacto empresarial aprobados' using errcode='22023'; end if;
  if p_publish and (not exists(select 1 from storage.objects where bucket_id='platform-media' and name=substring(p_content->>'hero' from 10) and split_part(name,'/',1)=o::text)
    or not exists(select 1 from storage.objects where bucket_id='platform-media' and name=substring(p_content->>'logo' from 10) and split_part(name,'/',1)=o::text)) then raise exception 'Recursos corporativos inexistentes o ajenos' using errcode='42501'; end if;
  select * into s from public.site_mode_settings where mode='ramaldi' for update;
  if p_revision is null or s.revision<>p_revision then raise exception 'Edición modificada por otra sesión' using errcode='40001'; end if;
  if p_publish then
    insert into public.site_mode_revisions(mode,revision,content,published_by) values('ramaldi',s.published_revision,coalesce(s.published_content,'{}'),auth.uid()) on conflict do nothing;
  end if;
  update public.site_mode_settings set draft=p_content,revision=revision+1,updated_at=now(),updated_by=auth.uid(),
    published_content=case when p_publish then p_content else published_content end,
    published_revision=published_revision+case when p_publish then 1 else 0 end where mode='ramaldi';
  perform public.platform_log(case when p_publish then 'enterprise_settings_publish' else 'enterprise_settings_draft' end,o,null,jsonb_build_object('revision',s.revision+1));
  return jsonb_build_object('revision',s.revision+1,'publishedRevision',s.published_revision+case when p_publish then 1 else 0 end);
end $$;

create or replace function public.platform_mode_impact(p_target text)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare s public.platform_state%rowtype; o public.organizations%rowtype; c integer; target_count integer; affected integer;
begin
  if not public.is_platform_superadmin() then raise exception 'Solo SUPERADMIN' using errcode='42501'; end if;
  if p_target not in ('thony','ramaldi') then raise exception 'Modo inválido' using errcode='22023'; end if;
  select * into s from public.platform_state where id=1;
  select * into o from public.organizations where slug='ramaldi';
  with visibility as (
    select coalesce(thony_visible and (organization_id is null or (workflow_state='published' and public.agent_publication_ready(organization_id,agent_id))),false) as personal,
      coalesce(ramaldi_visible and public.is_ramaldi_organization(organization_id) and workflow_state='published' and not price_provisional and public.agent_publication_ready(organization_id,agent_id),false) as corporate
    from public.properties where published and not demo
  ), compared as (
    select case when s.active_mode='thony' then personal else corporate end as before_visible,
      case when p_target='thony' then personal else corporate end as after_visible from visibility
  ) select count(*) filter(where before_visible),count(*) filter(where after_visible),count(*) filter(where before_visible<>after_visible) into c,target_count,affected from compared;
  return jsonb_build_object('currentMode',s.active_mode,'targetMode',p_target,'revision',s.revision,'currentProperties',c,'targetProperties',target_count,'affectedProperties',affected,
    'authorized',o.authorized_at is not null,'authorizationReference',o.authorization_reference,'registrationEnabled',o.registration_enabled,
    'ready',(select public.enterprise_settings_ready(published_content) from public.site_mode_settings where mode='ramaldi'));
end $$;
create or replace function public.change_site_mode(p_target text,p_revision integer,p_confirmation text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.platform_state%rowtype; o public.organizations%rowtype; impact jsonb;
begin
  if not public.is_platform_superadmin() then raise exception 'Solo SUPERADMIN' using errcode='42501'; end if;
  if p_target not in ('thony','ramaldi') or p_confirmation is distinct from ('CAMBIAR A '||upper(p_target)) then raise exception 'Confirmación explícita requerida' using errcode='22023'; end if;
  select * into s from public.platform_state where id=1 for update;
  select * into o from public.organizations where slug='ramaldi' for update;
  perform 1 from public.site_mode_settings where mode='ramaldi' for update;
  if p_revision is null or s.revision<>p_revision then raise exception 'La modalidad cambió en otra sesión' using errcode='40001'; end if;
  if s.active_mode=p_target then raise exception 'Ese modo ya está activo' using errcode='22023'; end if;
  if p_target='ramaldi' and (o.authorized_at is null or not (select public.enterprise_settings_ready(published_content) from public.site_mode_settings where mode='ramaldi')) then
    raise exception 'Falta aprobación corporativa o configuración publicada' using errcode='42501'; end if;
  impact:=public.platform_mode_impact(p_target);
  update public.platform_state set active_mode=p_target,revision=revision+1,changed_at=now(),changed_by=auth.uid() where id=1;
  insert into public.mode_change_audit(actor_id,previous_mode,new_mode,revision,property_count,authorization_reference)
    values(auth.uid(),s.active_mode,p_target,s.revision+1,(impact->>'targetProperties')::integer,o.authorization_reference);
  return impact || jsonb_build_object('activeMode',p_target,'revision',s.revision+1);
end $$;

create or replace function public.create_membership_invitation(p_email text,p_token_hash text)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare o uuid; i uuid;
begin
  select id into o from public.organizations where slug='ramaldi';
  if not public.is_organization_admin(o) then raise exception 'Permiso requerido' using errcode='42501'; end if;
  if p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Correo inválido' using errcode='22023'; end if;
  if (select count(*) from public.membership_invitations where invited_by=auth.uid() and created_at>now()-interval '1 hour')>=20 then raise exception 'Límite de invitaciones por hora' using errcode='54000'; end if;
  insert into public.membership_invitations(organization_id,email,token_hash,invited_by) values(o,lower(trim(p_email)),p_token_hash,auth.uid()) returning id into i;
  perform public.platform_log('invitation_created',o,i,jsonb_build_object('email',lower(trim(p_email))));
  return i;
end $$;
create or replace function public.check_membership_invitation(p_email text,p_token_hash text)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select public.enterprise_enabled() and exists(select 1 from public.membership_invitations i join public.organizations o on o.id=i.organization_id
    where o.registration_enabled and i.email=lower(trim(p_email)) and i.token_hash=p_token_hash and i.accepted_at is null and i.revoked_at is null and i.expires_at>now());
$$;
create or replace function public.revoke_membership_invitation(p_id uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare i public.membership_invitations%rowtype;
begin
  select * into i from public.membership_invitations where id=p_id for update;
  if i.id is null or not public.is_organization_admin(i.organization_id) then raise exception 'Permiso requerido' using errcode='42501'; end if;
  if i.accepted_at is not null then raise exception 'La invitación ya fue utilizada' using errcode='22023'; end if;
  update public.membership_invitations set revoked_at=now() where id=p_id;
  perform public.platform_log('invitation_revoked',i.organization_id,p_id,'{}');
end $$;
-- Registrar esta función como Before User Created en Supabase Auth antes de
-- habilitar altas. También cierra llamadas directas a Auth, fuera de Next.js.
create or replace function public.before_platform_user_created(event jsonb)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare e text; h text;
begin
  e:=event->'user'->>'email';
  h:=event->'user'->'user_metadata'->>'platform_invitation';
  if e is null or h is null or h !~ '^[a-f0-9]{64}$' or not public.check_membership_invitation(e,h) then
    return jsonb_build_object('error',jsonb_build_object('http_code',403,'message','El registro requiere una invitación vigente y una incorporación empresarial habilitada.'));
  end if;
  return '{}'::jsonb;
end $$;
revoke all on function public.before_platform_user_created(jsonb) from public,anon,authenticated;
do $$ begin
  if exists(select 1 from pg_roles where rolname='supabase_auth_admin') then
    grant execute on function public.before_platform_user_created(jsonb) to supabase_auth_admin;
  end if;
end $$;
create or replace function public.accept_membership_invitation(p_token_hash text,p_application jsonb)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare i public.membership_invitations%rowtype; e text;
begin
  if not public.platform_verified_user() or not public.enterprise_enabled() then raise exception 'Confirma tu correo y espera la activación autorizada' using errcode='42501'; end if;
  select lower(email) into e from auth.users where id=auth.uid();
  select * into i from public.membership_invitations where token_hash=p_token_hash for update;
  if i.id is null or not public.check_membership_invitation(e,p_token_hash) then raise exception 'Invitación no válida o cerrada' using errcode='42501'; end if;
  if p_application is null or jsonb_typeof(p_application)<>'object' or octet_length(p_application::text)>4000
    or not public.platform_text_fields_valid(p_application,array['name','description']) or coalesce(length(p_application->>'name'),0)>80 or coalesce(length(p_application->>'description'),0)>2000 then raise exception 'Solicitud no válida' using errcode='22023'; end if;
  insert into public.organization_members(organization_id,user_id,application) values(i.organization_id,auth.uid(),p_application);
  update public.membership_invitations set accepted_at=now() where id=i.id;
  perform public.platform_log('membership_application',i.organization_id,auth.uid(),'{}');
end $$;
create or replace function public.update_membership_application(p_application jsonb,p_revision integer)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare o uuid;
begin
  select id into o from public.organizations where slug='ramaldi';
  if not public.platform_verified_user() or p_application is null or jsonb_typeof(p_application)<>'object' or octet_length(p_application::text)>4000
    or not public.platform_text_fields_valid(p_application,array['name','description']) or coalesce(length(p_application->>'name'),0)>80 or coalesce(length(p_application->>'description'),0)>2000 then raise exception 'Solicitud no válida' using errcode='22023'; end if;
  update public.organization_members set application=p_application,revision=revision+1,updated_at=now() where organization_id=o and user_id=auth.uid() and status='pending' and revision=p_revision;
  if not found then raise exception 'Solicitud no editable o modificada' using errcode='40001'; end if;
end $$;
create or replace function public.review_organization_member(p_user uuid,p_status text,p_role text,p_note text,p_revision integer)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare o uuid; m public.organization_members%rowtype;
begin
  select id into o from public.organizations where slug='ramaldi';
  if not public.is_organization_admin(o) then raise exception 'Permiso requerido' using errcode='42501'; end if;
  if p_status not in ('active','suspended','rejected') or p_role not in ('agent','business_admin') or length(p_note)>2000 then raise exception 'Revisión inválida' using errcode='22023'; end if;
  select * into m from public.organization_members where organization_id=o and user_id=p_user for update;
  if m.user_id is null or m.revision is distinct from p_revision then raise exception 'Solicitud modificada' using errcode='40001'; end if;
  if (p_role='business_admin' or m.role='business_admin') and not public.is_platform_superadmin() then raise exception 'Solo SUPERADMIN gestiona administradores' using errcode='42501'; end if;
  if p_user=auth.uid() then raise exception 'No puedes cambiar tu propio permiso' using errcode='42501'; end if;
  if p_status='active' and not exists(select 1 from auth.users where id=p_user and email_confirmed_at is not null) then raise exception 'Correo sin verificar' using errcode='42501'; end if;
  update public.organization_members set status=p_status,role=p_role,reviewer_note=p_note,revision=revision+1,updated_at=now() where organization_id=o and user_id=p_user;
  perform public.platform_log('membership_review',o,p_user,jsonb_build_object('fromStatus',m.status,'status',p_status,'fromRole',m.role,'role',p_role,'note',p_note));
end $$;

-- Referencias nuevas solo a archivos propios; los revisores pueden reutilizar
-- archivos de su organización, nunca archivos de otra organización.
create or replace function public.enterprise_file_allowed(p_path text,p_org uuid,p_owner uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select coalesce(p_path like 'platform/'||p_org::text||'/'||p_owner::text||'/%' and p_path !~ '(\.\.|%|\\)' and
    exists(select 1 from storage.objects where bucket_id='platform-media' and name=substring(p_path from 10)),false);
$$;
create or replace function public.save_agent_profile(p_slug text,p_content jsonb,p_revision integer,p_submit boolean default false)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare o uuid; a public.agent_profiles%rowtype;
begin
  select id into o from public.organizations where slug='ramaldi';
  if not public.can_work_in_organization(o) or not public.is_active_agent(o,auth.uid()) then raise exception 'Asesor activo requerido' using errcode='42501'; end if;
  if p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(p_slug)>80 or p_content is null or jsonb_typeof(p_content)<>'object' or octet_length(p_content::text)>12000 then raise exception 'Perfil inválido' using errcode='22023'; end if;
  if not public.platform_text_fields_valid(p_content,array['name','photo','role','description','phone','whatsapp','email','instagram','specialties']) or not public.platform_contacts_valid(p_content)
    or (coalesce(p_content->>'instagram','')<>'' and (p_content->>'instagram') !~ '^https://(www\.)?instagram\.com/[a-zA-Z0-9_.]+/?$') then raise exception 'Campos de perfil no válidos' using errcode='22023'; end if;
  if coalesce(p_content->>'photo','')<>'' and (not public.enterprise_file_allowed(p_content->>'photo',o,auth.uid()) or (p_content->>'photo') !~ '\.(jpg|jpeg|png|webp)$') then raise exception 'Fotografía no autorizada' using errcode='42501'; end if;
  if p_submit and (coalesce(length(p_content->>'name'),0)<3 or coalesce(length(p_content->>'description'),0)<10 or coalesce(p_content->>'photo','')='') then raise exception 'Completa nombre, fotografía y descripción' using errcode='22023'; end if;
  select * into a from public.agent_profiles where organization_id=o and user_id=auth.uid() for update;
  if (a.user_id is null and p_revision is distinct from 0) or (a.user_id is not null and a.revision is distinct from p_revision) then raise exception 'Perfil modificado' using errcode='40001'; end if;
  insert into public.agent_profiles(organization_id,user_id,slug,draft,status,revision) values(o,auth.uid(),p_slug,p_content,case when p_submit then 'pending' else 'draft' end,1)
    on conflict (organization_id,user_id) do update set slug=excluded.slug,draft=excluded.draft,status=excluded.status,revision=public.agent_profiles.revision+1,updated_at=now();
  perform public.platform_log(case when p_submit then 'profile_submitted' else 'profile_draft' end,o,auth.uid(),'{}');
end $$;
create or replace function public.review_agent_profile(p_user uuid,p_action text,p_note text,p_revision integer)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare o uuid; a public.agent_profiles%rowtype;
begin
  select id into o from public.organizations where slug='ramaldi';
  if not public.is_organization_admin(o) then raise exception 'Permiso requerido' using errcode='42501'; end if;
  select * into a from public.agent_profiles where organization_id=o and user_id=p_user for update;
  if a.user_id is null or a.revision is distinct from p_revision then raise exception 'Perfil modificado' using errcode='40001'; end if;
  if p_action not in ('published','corrections','hidden','rejected') or length(p_note)>2000 then raise exception 'Revisión inválida' using errcode='22023'; end if;
  if p_action='published' and (a.status<>'pending' or not public.is_active_agent(o,p_user)) then raise exception 'Perfil no pendiente o asesor inactivo' using errcode='42501'; end if;
  update public.agent_profiles set status=p_action,published_content=case when p_action='published' then draft else published_content end,published_slug=case when p_action='published' then slug else published_slug end,
    public_enabled=case when p_action='published' then true when p_action in ('hidden','rejected') then false else public_enabled end,
    reviewer_note=p_note,revision=revision+1,updated_at=now() where organization_id=o and user_id=p_user;
  perform public.platform_log('profile_review',o,p_user,jsonb_build_object('status',p_action,'note',p_note));
end $$;

create or replace function public.save_enterprise_property(p_id uuid,p_content jsonb,p_version integer)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare o uuid; old_row public.properties%rowtype; r public.properties%rowtype; result uuid;
begin
  select id into o from public.organizations where slug='ramaldi';
  if not public.can_work_in_organization(o) or not public.is_active_agent(o,auth.uid()) then raise exception 'Asesor activo requerido' using errcode='42501'; end if;
  if p_content is null or jsonb_typeof(p_content)<>'object' or octet_length(p_content::text)>32768 then raise exception 'Ficha inválida' using errcode='22023'; end if;
  r:=jsonb_populate_record(null::public.properties,p_content);
  if r.title is null or length(trim(r.title)) not between 3 and 180 or r.slug is null then raise exception 'Completa nombre y dirección web' using errcode='22023'; end if;
  if p_id is not null then
    select * into old_row from public.properties where id=p_id for update;
    if old_row.id is null or old_row.organization_id is distinct from o or old_row.agent_id is distinct from auth.uid() then raise exception 'No puedes editar esta propiedad' using errcode='42501'; end if;
    if old_row.version is distinct from p_version then raise exception 'Propiedad modificada' using errcode='40001'; end if;
  elsif p_version is distinct from 0 then raise exception 'Versión inválida' using errcode='40001'; end if;
  if jsonb_typeof(coalesce(r.images,'[]'))<>'array' or jsonb_array_length(coalesce(r.images,'[]'))>40 or exists(select 1 from jsonb_array_elements(coalesce(r.images,'[]')) i where
    not public.enterprise_file_allowed(i->>'path',o,auth.uid()) or (i->>'path') !~ '\.(jpg|jpeg|png|webp)$' or jsonb_typeof(i->'alt') is distinct from 'string' or length(i->>'alt')>500) or
    (coalesce(r.brochure_path,'')<>'' and not public.enterprise_file_allowed(r.brochure_path,o,auth.uid())) then raise exception 'Archivo ajeno o inexistente' using errcode='42501'; end if;
  if p_id is null then
    insert into public.properties(slug,reference,title,location,type,operation,price,price_provisional,description,organization_id,agent_id,workflow_state,thony_visible,ramaldi_visible,published)
      values(r.slug,coalesce(r.reference,''),r.title,coalesce(r.location,''),coalesce(r.type,'Apartamento'),coalesce(r.operation,'Venta'),coalesce(r.price,0),true,'',o,auth.uid(),'draft',false,true,false) returning id into result;
  else result:=p_id; end if;
  update public.properties set slug=r.slug,reference=coalesce(r.reference,''),title=r.title,location=coalesce(r.location,''),neighborhood=coalesce(r.neighborhood,''),
    type=coalesce(r.type,'Apartamento'),operation=coalesce(r.operation,'Venta'),price=coalesce(r.price,0),price_provisional=coalesce(r.price_provisional,true),
    bedrooms=r.bedrooms,bathrooms=r.bathrooms,area=r.area,parking=r.parking,description=coalesce(r.description,''),amenities=coalesce(r.amenities,'{}'),images=coalesce(r.images,'[]'),
    images_are_renders=coalesce(r.images_are_renders,false),project_name=r.project_name,project_facts=r.project_facts,project_typologies=r.project_typologies,
    confirmation_note=r.confirmation_note,brochure_path=r.brochure_path,brochure_label=r.brochure_label,sort_order=r.sort_order,
    workflow_state='draft',published=false,version=version+1 where id=result;
  perform public.platform_log('property_draft',o,result,'{}');
  return result;
end $$;
create or replace function public.submit_enterprise_property(p_id uuid,p_version integer)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare p public.properties%rowtype;
begin
  select * into p from public.properties where id=p_id for update;
  if p.organization_id is null or p.agent_id is distinct from auth.uid() or not public.can_work_in_organization(p.organization_id) then raise exception 'Propiedad no autorizada' using errcode='42501'; end if;
  if p.version is distinct from p_version then raise exception 'Propiedad modificada' using errcode='40001'; end if;
  if p.workflow_state not in ('draft','corrections','rejected','hidden') or p.price_provisional or p.in_preparation or p.demo or length(trim(p.reference))=0 or length(trim(p.location))=0 or length(trim(p.description))<10 or jsonb_array_length(p.images)=0 or exists(select 1 from jsonb_array_elements(p.images) i where coalesce(length(trim(i->>'alt')),0)=0) then raise exception 'Completa datos, precio confirmado y fotografías descritas' using errcode='22023'; end if;
  update public.properties set workflow_state='pending',published=false,version=version+1 where id=p_id;
  perform public.platform_log('property_submitted',p.organization_id,p_id,'{}');
end $$;
create or replace function public.review_enterprise_property(p_id uuid,p_action text,p_note text,p_version integer,p_thony_visible boolean default false)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare p public.properties%rowtype;
begin
  select * into p from public.properties where id=p_id for update;
  if p.organization_id is null or not public.is_organization_admin(p.organization_id) then raise exception 'Permiso requerido' using errcode='42501'; end if;
  if p.version is distinct from p_version then raise exception 'Propiedad modificada' using errcode='40001'; end if;
  if p_action not in ('corrections','approved','published','hidden','rejected','sold','rented','visibility') or length(p_note)>2000 then raise exception 'Revisión inválida' using errcode='22023'; end if;
  if p_action='visibility' and not public.is_platform_superadmin() then raise exception 'Solo SUPERADMIN decide la visibilidad personal' using errcode='42501'; end if;
  if p_thony_visible is distinct from p.thony_visible and not public.is_platform_superadmin() then raise exception 'Visibilidad personal reservada a SUPERADMIN' using errcode='42501'; end if;
  if p_action='approved' and p.workflow_state<>'pending' then raise exception 'La ficha debe estar pendiente' using errcode='22023'; end if;
  if p_action='published' and (p.workflow_state<>'approved' or not public.agent_publication_ready(p.organization_id,p.agent_id)
    or not exists(select 1 from public.agent_profiles where organization_id=p.organization_id and user_id=p.agent_id and published_content is not null and public_enabled)) then raise exception 'Aprueba la ficha y el perfil del asesor antes de publicarla' using errcode='42501'; end if;
  update public.properties set workflow_state=case when p_action='visibility' then workflow_state else p_action end,published=case when p_action='visibility' then published else p_action='published' end,thony_visible=p_thony_visible,version=version+1 where id=p_id;
  insert into public.publication_approvals(property_id,reviewer_id,action,note,property_version) values(p_id,auth.uid(),p_action,p_note,p.version+1);
  perform public.platform_log('property_review',p.organization_id,p_id,jsonb_build_object('action',p_action,'note',p_note));
end $$;

create or replace function public.set_property_document(p_property uuid,p_version integer,p_path text,p_label text,p_kind text,p_public boolean,p_remove uuid default null)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare p public.properties%rowtype;
begin
  select * into p from public.properties where id=p_property for update;
  if p.organization_id is null or p.agent_id is distinct from auth.uid() or not public.can_work_in_organization(p.organization_id) then raise exception 'Propiedad no autorizada' using errcode='42501'; end if;
  if p.version is distinct from p_version then raise exception 'Propiedad modificada' using errcode='40001'; end if;
  if p_remove is not null then
    update public.property_documents set removed_at=now() where id=p_remove and property_id=p.id and owner_id=auth.uid() and removed_at is null;
    if not found then raise exception 'Documento no autorizado' using errcode='42501'; end if;
  else
    if not public.enterprise_file_allowed(p_path,p.organization_id,auth.uid()) or length(p_label) not between 3 and 160 or p_kind not in ('plan','document') or (p_public and p_kind<>'plan') then raise exception 'Documento no válido' using errcode='22023'; end if;
    insert into public.property_documents(property_id,organization_id,owner_id,path,label,kind,public_on_publication) values(p.id,p.organization_id,auth.uid(),p_path,p_label,p_kind,p_public);
  end if;
  update public.properties set workflow_state='draft',published=false,version=version+1 where id=p.id;
  perform public.platform_log(case when p_remove is null then 'property_document_added' else 'property_document_retired' end,p.organization_id,p.id,jsonb_build_object('publicOnApproval',p_public));
end $$;
create or replace function public.withdraw_enterprise_property(p_id uuid,p_version integer)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare p public.properties%rowtype;
begin
  select * into p from public.properties where id=p_id for update;
  if p.organization_id is null or p.agent_id is distinct from auth.uid() or not public.can_work_in_organization(p.organization_id) then raise exception 'Propiedad no autorizada' using errcode='42501'; end if;
  if p.version is distinct from p_version then raise exception 'Propiedad modificada' using errcode='40001'; end if;
  update public.properties set workflow_state='hidden',published=false,version=version+1 where id=p_id;
  perform public.platform_log('property_withdrawn',p.organization_id,p_id,'{}');
end $$;

-- Snapshot coherente: nunca devuelve borradores, invitaciones ni auditoría.
create or replace function public.public_platform_snapshot()
returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
  select jsonb_build_object('mode',s.active_mode,'revision',s.revision,
    'settings',case when s.active_mode='thony' then (select content from public.site_content where id=1) else (select published_content from public.site_mode_settings where mode='ramaldi') end,
    'registrationEnabled',s.active_mode='ramaldi' and exists(select 1 from public.organizations where slug='ramaldi' and authorized_at is not null and registration_enabled),
    'properties',coalesce((select jsonb_agg(to_jsonb(p)||jsonb_build_object('public_documents',coalesce((select jsonb_agg(jsonb_build_object('path',d.path,'label',d.label)) from public.property_documents d where d.property_id=p.id and d.public_on_publication and d.removed_at is null),'[]')) order by p.sort_order nulls last,p.created_at desc) from public.properties p
      where p.published and not p.demo and (
        (s.active_mode='thony' and p.thony_visible and (p.organization_id is null or (p.workflow_state='published' and public.agent_publication_ready(p.organization_id,p.agent_id))))
        or (s.active_mode='ramaldi' and p.organization_id=(select id from public.organizations where slug='ramaldi') and p.ramaldi_visible and p.workflow_state='published' and not p.price_provisional and public.agent_publication_ready(p.organization_id,p.agent_id)))), '[]'),
    'agents',case when s.active_mode='ramaldi' then coalesce((select jsonb_agg(jsonb_build_object('userId',a.user_id,'slug',a.published_slug,'content',a.published_content)) from public.agent_profiles a where a.organization_id=(select id from public.organizations where slug='ramaldi') and a.published_content is not null and a.public_enabled and public.is_active_agent(a.organization_id,a.user_id)), '[]') else '[]'::jsonb end)
  from public.platform_state s where s.id=1 and (s.active_mode='thony' or public.enterprise_enabled());
$$;

create or replace function public.public_platform_identity()
returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
  select jsonb_build_object('mode',active_mode,'revision',revision) from public.platform_state where id=1;
$$;
revoke all on function public.public_platform_identity() from public;
grant execute on function public.public_platform_identity() to anon,authenticated;

-- Almacén empresarial PRIVADO. El bucket legado se conserva intacto.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
  values('platform-media','platform-media',false,3145728,array['image/jpeg','image/png','image/webp','application/pdf'])
  on conflict(id) do nothing;
do $$ begin
  if exists(select 1 from storage.buckets where id='platform-media' and public) then
    raise exception 'El bucket platform-media ya existe como público: revisar la colisión antes de instalar' using errcode='55000';
  end if;
end $$;
create or replace function public.can_read_enterprise_media(p_name text)
returns boolean language plpgsql stable security definer set search_path=public,pg_temp as $$
declare o uuid; owner_id uuid; snapshot jsonb;
begin
  if p_name !~ '^[a-f0-9-]{36}/[a-f0-9-]{36}/[a-f0-9-]{36}\.(jpg|jpeg|png|webp|pdf)$' then return false; end if;
  o:=split_part(p_name,'/',1)::uuid; owner_id:=split_part(p_name,'/',2)::uuid;
  if public.is_organization_admin(o) or (owner_id=auth.uid() and public.can_work_in_organization(o)) then return true; end if;
  snapshot:=public.public_platform_snapshot();
  return (snapshot->>'mode'='ramaldi' and ((snapshot->'settings'->>'hero')='platform/'||p_name or (snapshot->'settings'->>'logo')='platform/'||p_name))
    or exists(select 1 from jsonb_array_elements(snapshot->'agents') a where (a->'content'->>'photo')='platform/'||p_name)
    or exists(select 1 from jsonb_array_elements(snapshot->'properties') p where p->>'brochure_path'='platform/'||p_name or exists(select 1 from jsonb_array_elements(p->'images') i where i->>'path'='platform/'||p_name)
      or exists(select 1 from jsonb_array_elements(p->'public_documents') d where d->>'path'='platform/'||p_name));
end $$;
drop policy if exists enterprise_media_insert on storage.objects;
create policy enterprise_media_insert on storage.objects for insert to authenticated with check (
  bucket_id='platform-media' and name ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}/[a-f0-9-]{36}\.(jpg|jpeg|png|webp|pdf)$'
  and split_part(name,'/',2)=auth.uid()::text and public.can_work_in_organization(split_part(name,'/',1)::uuid));
drop policy if exists enterprise_media_select on storage.objects;
create policy enterprise_media_select on storage.objects for select to anon,authenticated using (bucket_id='platform-media' and public.can_read_enterprise_media(name));
-- Las políticas de otros buckets se conservan; las restrictivas cierran este
-- bucket incluso si existe una concesión permisiva no versionada más amplia.
drop policy if exists enterprise_media_read_fence on storage.objects;
create policy enterprise_media_read_fence on storage.objects as restrictive for select to anon,authenticated using (bucket_id<>'platform-media' or public.can_read_enterprise_media(name));
drop policy if exists enterprise_media_insert_fence on storage.objects;
create policy enterprise_media_insert_fence on storage.objects as restrictive for insert to authenticated with check (
 bucket_id<>'platform-media' or (name ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}/[a-f0-9-]{36}\.(jpg|jpeg|png|webp|pdf)$' and split_part(name,'/',2)=auth.uid()::text and public.can_work_in_organization(split_part(name,'/',1)::uuid)));
drop policy if exists enterprise_media_update_fence on storage.objects;
create policy enterprise_media_update_fence on storage.objects as restrictive for update to authenticated using (bucket_id<>'platform-media') with check(bucket_id<>'platform-media');
drop policy if exists enterprise_media_delete_fence on storage.objects;
create policy enterprise_media_delete_fence on storage.objects as restrictive for delete to authenticated using (bucket_id<>'platform-media');
-- Sin UPDATE/DELETE empresarial: ni sustitución ni borrado de medios ajenos.

-- Cerrar ejecución por defecto. Las funciones privadas no se exponen a anon.
do $$ declare f record; begin
  for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in (
    'is_platform_superadmin','platform_verified_user','is_organization_admin','is_active_agent','agent_publication_ready','enterprise_enabled','can_work_in_organization','active_site_mode','enterprise_file_allowed',
    'platform_access','set_corporate_authorization','enterprise_settings_ready','save_enterprise_settings','platform_mode_impact','change_site_mode',
    'create_membership_invitation','revoke_membership_invitation','check_membership_invitation','accept_membership_invitation','update_membership_application','review_organization_member','set_property_document',
    'save_agent_profile','review_agent_profile','save_enterprise_property','submit_enterprise_property','review_enterprise_property','withdraw_enterprise_property','public_platform_snapshot','can_read_enterprise_media') loop
    execute format('revoke all on function %s from public,anon,authenticated',f.signature);
    execute format('grant execute on function %s to authenticated',f.signature);
  end loop;
end $$;
grant execute on function public.public_platform_snapshot(),public.check_membership_invitation(text,text),public.can_read_enterprise_media(text),public.active_site_mode(),public.is_platform_superadmin(),public.is_organization_admin(uuid),public.is_active_agent(uuid,uuid),public.agent_publication_ready(uuid,uuid),public.enterprise_enabled(),public.can_work_in_organization(uuid) to anon;
-- Compatibilidad de concesiones base: RLS sigue determinando cada fila visible.
grant select on public.properties to anon,authenticated;
grant insert,update,delete on public.properties to authenticated;
grant select on storage.objects to anon,authenticated;

commit;

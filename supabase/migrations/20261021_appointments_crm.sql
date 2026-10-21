-- Agenda privada de Thony. Aditiva, transaccional y repetible.
-- Requiere 20261020_dual_mode_platform.sql. No habilita reservas ni concede accesos.
begin;
create extension if not exists btree_gist;
do $$ begin
 if to_regclass('public.platform_superadmins') is null then
  raise exception 'Instala y revisa primero la migración de doble identidad';
 end if;
end $$;

create table if not exists public.appointment_settings (
 id uuid primary key default gen_random_uuid(), slug text not null unique,
 owner_user_id uuid references auth.users(id) on delete restrict,
 display_name text not null, email text not null, whatsapp text not null,
 timezone text not null default 'America/Santo_Domingo' check(timezone='America/Santo_Domingo'),
 enabled boolean not null default false,
 durations jsonb not null default '{"property_visit":120,"buy":120,"rent":120,"invest":120,"general":120}',
 buffer_minutes integer not null default 30 check(buffer_minutes in(0,15,30,45,60)),
 hold_hours integer not null default 12 check(hold_hours between 1 and 48),
 minimum_notice_minutes integer not null default 120 check(minimum_notice_minutes between 30 and 10080),
 booking_horizon_days integer not null default 60 check(booking_horizon_days between 1 and 90),
 max_daily_appointments integer not null default 4 check(max_daily_appointments between 1 and 24),
 modalities text[] not null default '{presencial}' check(cardinality(modalities)>0 and modalities <@ array['presencial','virtual']),
 meeting_locations jsonb not null default '[]',
 cancellation_minutes integer not null default 120 check(cancellation_minutes between 0 and 10080),
 reminder_24h boolean not null default true, reminder_day boolean not null default true,
 reminder_time time not null default '07:00',
 owner_whatsapp_opt_in boolean not null default false, owner_whatsapp_opt_in_at timestamptz,
 retention_days integer not null default 365 check(retention_days between 30 and 1825),
 revision integer not null default 0, updated_at timestamptz not null default now()
);
insert into public.appointment_settings(id,slug,display_name,email,whatsapp)
 values('10000000-0000-4000-8000-000000000001','thony','Thony Paulino','brokerthonypaulino@ramaldigroup.com','+18294045770') on conflict(slug) do nothing;
create table if not exists public.appointment_access_grants (
 calendar_id uuid not null references public.appointment_settings(id) on delete restrict,
 user_id uuid not null references auth.users(id) on delete restrict,
 kind text not null check(kind in('owner','technical')),
 can_manage boolean not null default false, can_read_leads boolean not null default false,
 can_export boolean not null default false, can_manage_permissions boolean not null default false,
 can_view_notifications boolean not null default false,
 authorized_by uuid references auth.users(id) on delete restrict,
 authorized_at timestamptz not null default now(), revoked_at timestamptz,
 primary key(calendar_id,user_id)
);
create table if not exists public.appointment_availability_rules (
 id uuid primary key default gen_random_uuid(), calendar_id uuid not null references public.appointment_settings(id),
 weekday integer check(weekday between 0 and 6), on_date date,
 starts_at time not null, ends_at time not null, enabled boolean not null default true,
 check(ends_at>starts_at), check((weekday is null)<>(on_date is null))
);
create table if not exists public.appointment_blackouts (
 id uuid primary key default gen_random_uuid(), calendar_id uuid not null references public.appointment_settings(id),
 label text not null check(length(label) between 1 and 160),
 starts_at timestamptz, ends_at timestamptz,
 weekday integer check(weekday between 0 and 6), start_time time, end_time time,
 valid_from date, valid_until date, enabled boolean not null default true,
 check((starts_at is not null and ends_at>starts_at and weekday is null and start_time is null and end_time is null)
  or(starts_at is null and ends_at is null and weekday is not null and start_time is not null and end_time>start_time
     and valid_from is not null and valid_until>=valid_from and valid_until<=valid_from+1096))
);
create table if not exists public.leads (
 id uuid primary key default gen_random_uuid(), calendar_id uuid not null references public.appointment_settings(id),
 name text not null check(length(name) between 2 and 160), email text, phone text,
 interest text not null, source text not null default 'website',
 commercial_status text not null default 'new' check(commercial_status in('new','contacted','interested','visit_scheduled','follow_up','negotiation','closed','not_interested')),
 communication_preference text not null check(communication_preference in('email','whatsapp','both')),
 operational_consent_at timestamptz not null, whatsapp_consent_at timestamptz,
 consent_version text not null default 'appointments-v1',
 responsible_user_id uuid references auth.users(id),
 first_contact_at timestamptz not null default now(), last_interaction_at timestamptz not null default now(),
 anonymized_at timestamptz, version integer not null default 0,
 check(email is null or(length(email)<=254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
 check(phone is null or phone ~ '^\+[1-9][0-9]{7,14}$')
);
create index if not exists leads_calendar_activity on public.leads(calendar_id,last_interaction_at desc);
create index if not exists leads_email_match on public.leads(calendar_id,lower(email));
create index if not exists leads_phone_match on public.leads(calendar_id,phone);
create table if not exists public.lead_notes (
 id uuid primary key default gen_random_uuid(), lead_id uuid not null references public.leads(id),
 calendar_id uuid not null references public.appointment_settings(id), author_id uuid not null references auth.users(id),
 body text not null check(length(body) between 1 and 4000), created_at timestamptz not null default now()
);
create table if not exists public.lead_tasks (
 id uuid primary key default gen_random_uuid(), lead_id uuid not null references public.leads(id),
 calendar_id uuid not null references public.appointment_settings(id), author_id uuid not null references auth.users(id),
 title text not null check(length(title) between 2 and 240), due_at timestamptz not null,
 status text not null default 'open' check(status in('open','done','cancelled')), created_at timestamptz not null default now()
);
create table if not exists public.appointments (
 id uuid primary key default gen_random_uuid(), calendar_id uuid not null references public.appointment_settings(id),
 lead_id uuid not null references public.leads(id), property_id uuid references public.properties(id) on delete set null,
 property_snapshot jsonb, kind text not null check(kind in('property_visit','buy','rent','invest','general')),
 modality text not null check(modality in('presencial','virtual')),
 starts_at timestamptz not null, ends_at timestamptz not null check(ends_at>starts_at),
 buffer_minutes integer not null check(buffer_minutes in(0,15,30,45,60)),
 status text not null default 'pending' check(status in('pending','confirmed','rejected','change_proposed','reschedule_requested','cancelled_client','cancelled_thony','expired','completed','no_show')),
 proposal_base_status text check(proposal_base_status in('pending','confirmed')),
 hold_expires_at timestamptz not null, confirmed_at timestamptz,
 instructions text not null default '' check(length(instructions)<=1500),
 comments text not null default '' check(length(comments)<=2000),
 idempotency_key uuid not null unique, request_digest text not null,
 version integer not null default 0, schedule_version integer not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists appointments_calendar_start on public.appointments(calendar_id,starts_at);
create index if not exists appointments_lead on public.appointments(lead_id,created_at);
create table if not exists public.appointment_proposals (
 id uuid primary key default gen_random_uuid(), appointment_id uuid not null references public.appointments(id),
 calendar_id uuid not null references public.appointment_settings(id),
 starts_at timestamptz not null, ends_at timestamptz not null check(ends_at>starts_at),
 buffer_minutes integer not null, expires_at timestamptz not null,
 initiated_by text not null check(initiated_by in('thony','client')),
 status text not null default 'pending' check(status in('pending','accepted','declined','expired','withdrawn')),
 created_by uuid references auth.users(id), created_at timestamptz not null default now(), resolved_at timestamptz
);
create unique index if not exists appointment_one_open_proposal on public.appointment_proposals(appointment_id) where status='pending';
create table if not exists public.appointment_reservations (
 id uuid primary key default gen_random_uuid(), calendar_id uuid not null references public.appointment_settings(id),
 appointment_id uuid not null references public.appointments(id),
 proposal_id uuid references public.appointment_proposals(id),
 kind text not null check(kind in('main','proposal')),
 occupied tstzrange not null check(not isempty(occupied) and lower_inc(occupied) and not upper_inc(occupied)
   and not lower_inf(occupied) and not upper_inf(occupied)),
 active boolean not null default true,
 -- Una propuesta puede solaparse con la cita ORIGINAL del mismo cliente. Nunca con otro cliente.
 exclude using gist(calendar_id with =, appointment_id with <>, occupied with &&) where(active)
);
create unique index if not exists appointment_one_main on public.appointment_reservations(appointment_id) where(active and kind='main');
create unique index if not exists appointment_one_proposal_hold on public.appointment_reservations(proposal_id) where(active and kind='proposal');
create table if not exists public.appointment_history (
 id uuid primary key default gen_random_uuid(), calendar_id uuid not null references public.appointment_settings(id),
 appointment_id uuid references public.appointments(id), lead_id uuid references public.leads(id),
 actor_id uuid references auth.users(id), actor_kind text not null default 'system', event text not null,
 from_status text, to_status text, details jsonb not null default '{}', created_at timestamptz not null default now()
);
create index if not exists appointment_history_order on public.appointment_history(calendar_id,created_at desc);
create table if not exists public.appointment_customer_grants (
 id uuid primary key default gen_random_uuid(), appointment_id uuid not null references public.appointments(id),
 nonce uuid not null default gen_random_uuid(), expires_at timestamptz not null,
 scopes text[] not null default '{read,cancel,propose,calendar,preferences}', revoked_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists public.notification_jobs (
 id uuid primary key default gen_random_uuid(), calendar_id uuid not null references public.appointment_settings(id),
 appointment_id uuid not null references public.appointments(id), event text not null,
 recipient text not null check(recipient in('owner','client')), channel text not null check(channel in('email','whatsapp')),
 dedupe_key text not null unique, payload jsonb not null,
 schedule_version integer not null, scheduled_at timestamptz not null, valid_until timestamptz,
 status text not null default 'pending' check(status in('pending','processing','blocked','retry','sent','delivered','failed','cancelled','uncertain')),
 attempts integer not null default 0, max_attempts integer not null default 5,
 available_at timestamptz not null default now(), claim_token uuid, lease_until timestamptz,
 provider text, provider_id text, last_error text,
 first_attempt_at timestamptz, sent_at timestamptz, delivered_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(attempts>=0 and max_attempts between 1 and 10)
);
create index if not exists notification_jobs_due on public.notification_jobs(available_at,scheduled_at) where status in('pending','retry','blocked');
create unique index if not exists notification_provider_id on public.notification_jobs(provider,provider_id) where provider_id is not null;
create table if not exists public.notification_attempts (
 id uuid primary key default gen_random_uuid(), job_id uuid not null references public.notification_jobs(id),
 calendar_id uuid not null references public.appointment_settings(id), claim_token uuid not null unique,
 attempt integer not null, outcome text not null default 'processing', provider text, provider_id text, error_code text,
 started_at timestamptz not null default now(), finished_at timestamptz
);
create table if not exists public.notification_delivery_events (
 id uuid primary key default gen_random_uuid(), job_id uuid references public.notification_jobs(id),
 provider text not null, event_id text not null, provider_id text, status text not null,
 occurred_at timestamptz not null default now(), created_at timestamptz not null default now(),
 unique(provider,event_id)
);
create table if not exists public.appointment_rate_limits (
 key_hash text not null, purpose text not null, bucket timestamptz not null, hits integer not null,
 primary key(key_hash,purpose,bucket)
);
create table if not exists public.appointment_runtime (
 id integer primary key check(id=1), server_secret_hash text check(server_secret_hash ~ '^[a-f0-9]{64}$'),
 last_worker_at timestamptz, last_worker_error text,
 scheduler_enabled_at timestamptz, scheduler_job_id bigint
);
insert into public.appointment_runtime(id) values(1) on conflict do nothing;

create or replace function public.appointment_permission(p_calendar uuid,p_permission text default 'manage')
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.appointment_access_grants g
 join public.appointment_settings c on c.id=g.calendar_id join auth.users u on u.id=g.user_id
 where g.calendar_id=p_calendar and g.user_id=auth.uid() and g.revoked_at is null and u.email_confirmed_at is not null
 and ((g.kind='owner' and c.owner_user_id=u.id and lower(u.email)=lower(c.email))
      or(g.kind='technical' and public.is_platform_superadmin()))
 and case p_permission when 'manage' then g.can_manage when 'leads' then g.can_read_leads
  when 'export' then g.can_export and g.can_read_leads when 'permissions' then g.can_manage_permissions
  when 'notifications' then g.can_view_notifications else false end)
$$;
create or replace function public.appointment_access()
returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select jsonb_build_object('installed',true,'calendarId',id,'manage',public.appointment_permission(id,'manage'),
 'leads',public.appointment_permission(id,'leads'),'export',public.appointment_permission(id,'export'),
 'permissions',public.appointment_permission(id,'permissions'),'notifications',public.appointment_permission(id,'notifications'))
 from public.appointment_settings where slug='thony'
$$;
create or replace function public.appointment_require(p_calendar uuid,p_permission text default 'manage')
returns void language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
 if not public.appointment_permission(p_calendar,p_permission) then raise exception 'Acceso privado a la agenda no autorizado' using errcode='42501'; end if;
 if not exists(select 1 from public.appointment_settings where id=p_calendar and slug='thony') then raise exception 'Agenda no autorizada' using errcode='42501';end if;
end $$;
create or replace function public.appointment_server_require(p_secret text)
returns void language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
 if p_secret is null or length(p_secret)<32 or not exists(select 1 from public.appointment_runtime where id=1
 and server_secret_hash=encode(sha256(convert_to(p_secret,'UTF8')),'hex')) then
 raise exception 'Servicio no autorizado' using errcode='42501';end if;
end $$;
create or replace function public.appointment_lock(p_calendar uuid)
returns void language sql volatile security definer set search_path=public,pg_temp as $$select pg_advisory_xact_lock(hashtextextended(p_calendar::text,8312026))$$;
create or replace function public.appointment_log(p_calendar uuid,p_appointment uuid,p_lead uuid,p_event text,p_from text default null,p_to text default null,p_details jsonb default '{}',p_actor text default 'admin')
returns void language sql security definer set search_path=public,pg_temp as $$
 insert into public.appointment_history(calendar_id,appointment_id,lead_id,actor_id,actor_kind,event,from_status,to_status,details)
 values(p_calendar,p_appointment,p_lead,auth.uid(),p_actor,p_event,p_from,p_to,p_details)
$$;

-- Tablas privadas: solo lectura RLS autorizada. Toda escritura pasa por RPC cerradas.
do $$ declare n text; perm text; begin
 foreach n in array array['appointment_settings','appointment_access_grants','appointment_availability_rules','appointment_blackouts','leads','lead_notes','lead_tasks','appointments','appointment_proposals','appointment_reservations','appointment_history','notification_jobs','notification_attempts'] loop
  execute format('alter table public.%I enable row level security',n);
  execute format('revoke all on public.%I from anon,authenticated',n);
  execute format('grant select on public.%I to authenticated',n);
  perm:=case when n in('leads','lead_notes','lead_tasks') then 'leads' when n in('notification_jobs','notification_attempts') then 'notifications' else 'manage' end;
  execute format('drop policy if exists appointment_private_read on public.%I',n);
  if n<>'appointment_settings' then
   execute format('create policy appointment_private_read on public.%I for select to authenticated using(public.appointment_permission(calendar_id,%L))',n,perm);
  end if;
 end loop;
end $$;
-- La configuración usa su ID como identificador de agenda.
drop policy if exists appointment_private_read on public.appointment_settings;
create policy appointment_private_read on public.appointment_settings for select to authenticated using(public.appointment_permission(id));
do $$ declare n text; begin
 foreach n in array array['appointment_customer_grants','notification_delivery_events','appointment_rate_limits','appointment_runtime'] loop
  execute format('alter table public.%I enable row level security',n);
  execute format('revoke all on public.%I from anon,authenticated',n);
 end loop;
end $$;
revoke select on public.notification_attempts from authenticated;
grant select(id,job_id,calendar_id,attempt,outcome,provider,provider_id,error_code,started_at,finished_at) on public.notification_attempts to authenticated;
-- Los auditores ven estados, nunca el payload ni las capacidades del cliente.
revoke select on public.notification_jobs from authenticated;
grant select(id,calendar_id,appointment_id,event,recipient,channel,schedule_version,scheduled_at,valid_until,status,
 attempts,max_attempts,available_at,provider,provider_id,last_error,first_attempt_at,sent_at,delivered_at,created_at,updated_at)
 on public.notification_jobs to authenticated;
create unique index if not exists leads_calendar_id on public.leads(calendar_id,id);
create unique index if not exists appointments_calendar_id on public.appointments(calendar_id,id);
create unique index if not exists proposals_appointment_id on public.appointment_proposals(appointment_id,id);
do $$ begin
 if not exists(select 1 from pg_constraint where conname='appointments_lead_calendar_fk') then
  alter table public.appointments add constraint appointments_lead_calendar_fk foreign key(calendar_id,lead_id) references public.leads(calendar_id,id);
  alter table public.lead_notes add constraint lead_notes_calendar_fk foreign key(calendar_id,lead_id) references public.leads(calendar_id,id);
  alter table public.lead_tasks add constraint lead_tasks_calendar_fk foreign key(calendar_id,lead_id) references public.leads(calendar_id,id);
  alter table public.appointment_proposals add constraint proposals_calendar_fk foreign key(calendar_id,appointment_id) references public.appointments(calendar_id,id);
  alter table public.appointment_reservations add constraint reservations_calendar_fk foreign key(calendar_id,appointment_id) references public.appointments(calendar_id,id);
  alter table public.appointment_reservations add constraint reservations_proposal_fk foreign key(appointment_id,proposal_id) references public.appointment_proposals(appointment_id,id);
 end if;
end $$;

create or replace function public.appointment_blackout_overlap(p_calendar uuid,p_start timestamptz,p_end timestamptz)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.appointment_blackouts b where b.calendar_id=p_calendar and b.enabled and (
  (b.starts_at is not null and tstzrange(b.starts_at,b.ends_at,'[)') && tstzrange(p_start,p_end,'[)')) or
  (b.weekday is not null and exists(select 1 from generate_series(
    (p_start at time zone 'America/Santo_Domingo')::date::timestamp,
    (p_end at time zone 'America/Santo_Domingo')::date::timestamp,interval '1 day') d
    where d::date between b.valid_from and b.valid_until and extract(dow from d)=b.weekday
    and tstzrange((d::date+b.start_time) at time zone 'America/Santo_Domingo',
     (d::date+b.end_time) at time zone 'America/Santo_Domingo','[)') && tstzrange(p_start,p_end,'[)')))))
$$;
create or replace function public.appointment_queue_event(p_id uuid,p_event text,p_due timestamptz default now(),p_proposal uuid default null)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.appointments; c public.appointment_settings; l public.leads; pr public.appointment_proposals;
 g public.appointment_customer_grants; recipient_name text; ch text; body jsonb; until_at timestamptz;
begin
 select * into a from public.appointments where id=p_id;
 select * into c from public.appointment_settings where id=a.calendar_id;
 select * into l from public.leads where id=a.lead_id;
 if a.id is null or l.anonymized_at is not null then return;end if;
 if p_proposal is not null then select * into pr from public.appointment_proposals where id=p_proposal and appointment_id=a.id;end if;
 select * into g from public.appointment_customer_grants where appointment_id=a.id and revoked_at is null
  and expires_at>=greatest(coalesce(pr.ends_at,a.ends_at)+interval '7 days',now()+interval '1 day') order by created_at desc limit 1;
 if g.id is null then
  insert into public.appointment_customer_grants(appointment_id,expires_at)
   values(a.id,greatest(coalesce(pr.ends_at,a.ends_at)+interval '7 days',now()+interval '1 day')) returning * into g;
 end if;
 until_at:=case when p_event like 'reminder_%' then least(a.starts_at-interval '15 minutes',p_due+interval '1 hour') else p_due+interval '48 hours' end;
 foreach recipient_name in array array['owner','client'] loop
  foreach ch in array array['email','whatsapp'] loop
   if ch='whatsapp' and ((recipient_name='owner' and not c.owner_whatsapp_opt_in)
     or(recipient_name='client' and l.whatsapp_consent_at is null)) then continue;end if;
   if p_event like 'reminder_%' and exists(select 1 from public.notification_jobs where appointment_id=a.id and event=p_event and schedule_version=a.schedule_version and recipient=recipient_name and channel=ch and status in('processing','uncertain','sent','delivered')) then continue;end if;
   body:=jsonb_build_object('appointmentId',a.id,'name',l.name,'email',l.email,'phone',l.phone,
    'kind',a.kind,'modality',a.modality,'startsAt',coalesce(pr.starts_at,a.starts_at),'endsAt',coalesce(pr.ends_at,a.ends_at),
    'originalStartsAt',a.starts_at,'instructions',a.instructions,'property',a.property_snapshot,
    'comments',case when recipient_name='owner' then a.comments else '' end,'status',a.status,
    'ownerName',c.display_name,'ownerEmail',c.email,'ownerWhatsapp',c.whatsapp,
    'grant',case when recipient_name='client' then jsonb_build_object('id',g.id,'nonce',g.nonce,'expiresAt',extract(epoch from g.expires_at)::bigint) else null end,
    'sequence',a.schedule_version,'proposalId',pr.id);
   insert into public.notification_jobs(calendar_id,appointment_id,event,recipient,channel,dedupe_key,payload,schedule_version,scheduled_at,valid_until)
    values(a.calendar_id,a.id,p_event,recipient_name,ch,
     concat_ws(':',a.id,p_event,case when p_event like 'reminder_%' then a.schedule_version else a.version end,coalesce(p_proposal::text,''),recipient_name,ch,case when p_event like 'reminder_%' then c.revision else 0 end),
     body,a.schedule_version,p_due,until_at) on conflict(dedupe_key) do nothing;
  end loop;
 end loop;
end $$;
create or replace function public.appointment_schedule_reminders(p_id uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.appointments; c public.appointment_settings; due_at timestamptz;
begin
 select * into a from public.appointments where id=p_id;
 if a.status<>'confirmed' and not(a.status in('change_proposed','reschedule_requested') and a.proposal_base_status='confirmed') then return;end if;
 select * into c from public.appointment_settings where id=a.calendar_id;
 if c.reminder_24h and a.starts_at-interval '24 hours'>now() then
  perform public.appointment_queue_event(a.id,'reminder_24h',a.starts_at-interval '24 hours');end if;
 due_at:=least(((a.starts_at at time zone c.timezone)::date+c.reminder_time) at time zone c.timezone,a.starts_at-interval '1 hour');
 if c.reminder_day and due_at>now() then perform public.appointment_queue_event(a.id,'reminder_day',due_at);end if;
end $$;
create or replace function public.appointment_expire(p_calendar uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.appointments; pr public.appointment_proposals; restored text;
begin
 perform public.appointment_lock(p_calendar);
 for pr in select * from public.appointment_proposals where calendar_id=p_calendar and status='pending' and expires_at<=now() for update loop
  select * into a from public.appointments where id=pr.appointment_id for update;
  update public.appointment_proposals set status='expired',resolved_at=now() where id=pr.id;
  update public.appointment_reservations set active=false where proposal_id=pr.id;
  restored:=case when a.proposal_base_status='pending' and a.hold_expires_at<=now() then 'expired' else a.proposal_base_status end;
  update public.appointments set status=coalesce(restored,'expired'),proposal_base_status=null,version=version+1,updated_at=now() where id=a.id;
  update public.notification_jobs set status='cancelled',last_error='proposal_expired',updated_at=now()
   where appointment_id=a.id and event='proposal' and status in('pending','retry','blocked');
  perform public.appointment_log(p_calendar,a.id,a.lead_id,'proposal_expired',a.status,restored,'{}','system');
  perform public.appointment_queue_event(a.id,'proposal_expired');
 end loop;
 for a in select * from public.appointments where calendar_id=p_calendar and status='pending' and hold_expires_at<=now() for update loop
  update public.appointments set status='expired',version=version+1,updated_at=now() where id=a.id;
  update public.appointment_reservations set active=false where appointment_id=a.id;
  update public.notification_jobs set status='cancelled',last_error='hold_expired',updated_at=now()
   where appointment_id=a.id and status in('pending','retry','blocked');
  perform public.appointment_log(p_calendar,a.id,a.lead_id,'expired',a.status,'expired','{}','system');
  perform public.appointment_queue_event(a.id,'expired');
 end loop;
 -- También las propuestas pendientes cuya base acaba de vencer.
 update public.appointment_reservations r set active=false from public.appointments expired_appointment
 where r.appointment_id=expired_appointment.id and expired_appointment.calendar_id=p_calendar and expired_appointment.status in('expired','rejected','cancelled_client','cancelled_thony','completed','no_show');
end $$;
create or replace function public.appointment_slot_valid(p_calendar uuid,p_kind text,p_modality text,p_start timestamptz,p_exclude uuid default null,p_duration integer default null,p_buffer integer default null)
returns boolean language plpgsql stable security definer set search_path=public,pg_temp as $$
declare c public.appointment_settings; duration_minutes integer; finish timestamptz; local_day date; local_time time;
begin
 select * into c from public.appointment_settings where id=p_calendar;
 if c.id is null or p_kind not in('property_visit','buy','rent','invest','general') or not (p_modality=any(c.modalities))
  or p_start<now()+make_interval(mins=>c.minimum_notice_minutes)
  or (p_start at time zone c.timezone)::date>(now() at time zone c.timezone)::date+c.booking_horizon_days then return false;end if;
 duration_minutes:=coalesce(p_duration,(c.durations->>p_kind)::integer);
 if duration_minutes is null or duration_minutes not between 30 and 480 then return false;end if;
 finish:=p_start+make_interval(mins=>duration_minutes+coalesce(p_buffer,c.buffer_minutes));
 local_day:=(p_start at time zone c.timezone)::date;local_time:=(p_start at time zone c.timezone)::time;
 if extract(second from local_time)<>0 or mod(extract(minute from local_time)::integer,30)<>0 then return false;end if;
 if not exists(select 1 from public.appointment_availability_rules r where r.calendar_id=c.id and r.enabled
  and (r.on_date=local_day or(r.on_date is null and r.weekday=extract(dow from local_day)))
  and p_start>=(local_day+r.starts_at) at time zone c.timezone and finish<=(local_day+r.ends_at) at time zone c.timezone) then return false;end if;
 if public.appointment_blackout_overlap(c.id,p_start,finish) then return false;end if;
 if exists(select 1 from public.appointment_reservations where calendar_id=c.id and active
  and appointment_id is distinct from p_exclude and occupied && tstzrange(p_start,finish,'[)')) then return false;end if;
 if(select count(*) from(select appointment_id from public.appointment_reservations where calendar_id=c.id and active and appointment_id is distinct from p_exclude and (lower(occupied) at time zone c.timezone)::date=local_day
  union select id from public.appointments where calendar_id=c.id and id is distinct from p_exclude and status in('completed','no_show') and(starts_at at time zone c.timezone)::date=local_day) workload)>=c.max_daily_appointments then return false;end if;
 return true;
end $$;
create or replace function public.appointment_public_config()
returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select jsonb_build_object('installed',true,'enabled',c.enabled and c.owner_user_id is not null
  and exists(select 1 from public.appointment_access_grants g join auth.users u on u.id=g.user_id where g.calendar_id=c.id and g.user_id=c.owner_user_id and g.kind='owner' and g.can_manage and g.revoked_at is null and u.email_confirmed_at is not null and lower(u.email)=lower(c.email))
  and exists(select 1 from public.appointment_runtime where scheduler_enabled_at is not null and last_worker_at>now()-interval '5 minutes')
  and exists(select 1 from public.platform_state where id=1 and active_mode='thony')
  and exists(select 1 from public.appointment_runtime where server_secret_hash is not null)
  and exists(select 1 from public.appointment_availability_rules where calendar_id=c.id and enabled),
 'timezone',c.timezone,'durations',c.durations,'bufferMinutes',c.buffer_minutes,'holdHours',c.hold_hours,
 'minimumNoticeMinutes',c.minimum_notice_minutes,'bookingHorizonDays',c.booking_horizon_days,
 'modalities',c.modalities,'cancellationMinutes',c.cancellation_minutes,'retentionDays',c.retention_days)
 from public.appointment_settings c where slug='thony'
$$;
create or replace function public.appointment_public_slots(p_day date,p_kind text,p_modality text default 'presencial')
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.appointment_settings; result jsonb; config jsonb;
begin
 select * into c from public.appointment_settings where slug='thony';
 if p_day is null or p_day<(now() at time zone c.timezone)::date or p_day>(now() at time zone c.timezone)::date+c.booking_horizon_days then
  return '[]'::jsonb;end if;
 perform public.appointment_expire(c.id);config:=public.appointment_public_config();
 if not(config->>'enabled')::boolean then return '[]'::jsonb;end if;
 select coalesce(jsonb_agg(jsonb_build_object('startsAt',v,'endsAt',v+make_interval(mins=>(c.durations->>p_kind)::integer)) order by v),'[]'::jsonb)
 into result from generate_series(p_day::timestamp at time zone c.timezone,
  (p_day::timestamp+interval '23 hours 30 minutes') at time zone c.timezone,interval '30 minutes') v
 where public.appointment_slot_valid(c.id,p_kind,p_modality,v);
 return result;
end $$;
create or replace function public.appointment_rate_gate(p_secret text,p_key text,p_purpose text)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare n integer; max_hits integer;
begin
 perform public.appointment_server_require(p_secret);
 if p_key !~ '^[a-f0-9]{64}$' or p_purpose not in('availability','booking_ip','booking_contact','access','recover') then raise exception 'Solicitud inválida' using errcode='22023';end if;
 max_hits:=case p_purpose when 'availability' then 180 when 'booking_ip' then 12 when 'booking_contact' then 4 else 30 end;
 insert into public.appointment_rate_limits(key_hash,purpose,bucket,hits) values(p_key,p_purpose,date_trunc('hour',now()),1)
 on conflict(key_hash,purpose,bucket) do update set hits=public.appointment_rate_limits.hits+1 returning hits into n;
 return n<=max_hits;
end $$;
create or replace function public.appointment_request(p_secret text,p_key uuid,p_data jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.appointment_settings; a public.appointments; l public.leads; prop public.properties;
 raw_start timestamptz; duration_minutes integer; digest text; g public.appointment_customer_grants; config jsonb;
begin
 perform public.appointment_server_require(p_secret);
 select * into c from public.appointment_settings where slug='thony';perform public.appointment_lock(c.id);
 perform 1 from public.platform_state where id=1 for share;perform public.appointment_expire(c.id);
 if jsonb_typeof(p_data)<>'object' or length(p_data::text)>10000 or exists(select 1 from jsonb_object_keys(p_data) k
  where k not in('name','email','phone','kind','propertyId','startsAt','modality','comments','communicationPreference','operationalConsent','whatsappConsent'))
  or jsonb_typeof(p_data->'name')<>'string' or length(trim(p_data->>'name')) not between 2 and 160
  or jsonb_typeof(p_data->'email')<>'string' or length(p_data->>'email')>254 or (p_data->>'email') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  or (p_data->>'phone') !~ '^\+[1-9][0-9]{7,14}$' or jsonb_typeof(p_data->'phone')<>'string'
  or coalesce(p_data->>'kind','') not in('property_visit','buy','rent','invest','general')
  or coalesce(p_data->>'modality','') not in('presencial','virtual')
  or coalesce(p_data->>'communicationPreference','') not in('email','whatsapp','both')
  or p_data->'operationalConsent' is distinct from 'true'::jsonb
  or (p_data ? 'comments' and(jsonb_typeof(p_data->'comments')<>'string' or length(p_data->>'comments')>2000))
  or (p_data ? 'whatsappConsent' and jsonb_typeof(p_data->'whatsappConsent') is distinct from 'boolean')
  or((p_data->>'communicationPreference') in('whatsapp','both') and p_data->'whatsappConsent' is distinct from 'true'::jsonb)
  or not(p_data ?& array['name','email','phone','kind','startsAt','modality','communicationPreference','operationalConsent']) then
  raise exception 'Revisa los datos y consentimientos de la solicitud' using errcode='22023';end if;
 digest:=encode(sha256(convert_to(p_data::text,'UTF8')),'hex');
 select * into a from public.appointments where idempotency_key=p_key;
 if a.id is not null then
  if a.request_digest<>digest then raise exception 'La operación ya se usó para otros datos' using errcode='23505';end if;
 else
  config:=public.appointment_public_config();
  if not(config->>'enabled')::boolean then raise exception 'La agenda no recibe solicitudes en este momento' using errcode='55000';end if;
  begin raw_start:=(p_data->>'startsAt')::timestamptz;exception when others then raise exception 'Fecha inválida' using errcode='22023';end;
  if not public.appointment_slot_valid(c.id,p_data->>'kind',p_data->>'modality',raw_start) then raise exception 'Ese horario dejó de estar disponible. Selecciona otro.' using errcode='23P01';end if;
  if coalesce(p_data->>'propertyId','')<>'' then
   select * into prop from public.properties verified_property where id=(p_data->>'propertyId')::uuid and published and not demo and not in_preparation and thony_visible
   and exists(select 1 from jsonb_array_elements(public.public_platform_snapshot()->'properties') visible where visible->>'id'=verified_property.id::text) for share;
   if prop.id is null then raise exception 'La propiedad no está disponible para visitas' using errcode='22023';end if;
  end if;
  if p_data->>'kind'='property_visit' and prop.id is null then raise exception 'Selecciona una propiedad publicada' using errcode='22023';end if;
  duration_minutes:=(c.durations->>(p_data->>'kind'))::integer;
  insert into public.leads(calendar_id,name,email,phone,interest,source,communication_preference,operational_consent_at,whatsapp_consent_at,responsible_user_id)
   values(c.id,trim(p_data->>'name'),lower(trim(p_data->>'email')),p_data->>'phone',p_data->>'kind',case when prop.id is null then 'website' else 'property' end,
    p_data->>'communicationPreference',now(),case when p_data->'whatsappConsent'='true'::jsonb then now() else null end,c.owner_user_id) returning * into l;
  insert into public.appointments(calendar_id,lead_id,property_id,property_snapshot,kind,modality,starts_at,ends_at,buffer_minutes,hold_expires_at,comments,idempotency_key,request_digest)
   values(c.id,l.id,prop.id,case when prop.id is null then null else jsonb_build_object('id',prop.id,'reference',prop.reference,'title',prop.title,'slug',prop.slug) end,
    p_data->>'kind',p_data->>'modality',raw_start,raw_start+make_interval(mins=>duration_minutes),c.buffer_minutes,
    least(now()+make_interval(hours=>c.hold_hours),raw_start-interval '15 minutes'),coalesce(p_data->>'comments',''),p_key,digest) returning * into a;
  insert into public.appointment_reservations(calendar_id,appointment_id,kind,occupied)
   values(c.id,a.id,'main',tstzrange(a.starts_at,a.ends_at+make_interval(mins=>a.buffer_minutes),'[)'));
  perform public.appointment_log(c.id,a.id,l.id,'requested',null,'pending',jsonb_build_object('consentVersion','appointments-v1'),'client');
  perform public.appointment_queue_event(a.id,'received');
 end if;
 select * into g from public.appointment_customer_grants where appointment_id=a.id and revoked_at is null and expires_at>now() order by created_at desc limit 1;
 return jsonb_build_object('id',a.id,'status',a.status,'startsAt',a.starts_at,'endsAt',a.ends_at,'expiresAt',a.hold_expires_at,
  'grant',jsonb_build_object('id',g.id,'nonce',g.nonce,'expiresAt',extract(epoch from g.expires_at)::bigint));
end $$;
create or replace function public.appointment_configure(p_action text,p_data jsonb,p_expected integer)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.appointment_settings; v public.appointment_settings; b public.appointment_blackouts;
 r public.appointment_availability_rules; field text; target_id uuid; scheduled public.appointments; reminders_changed boolean:=false;
begin
 select * into c from public.appointment_settings where slug='thony';perform public.appointment_require(c.id);
 perform public.appointment_lock(c.id);select * into c from public.appointment_settings where id=c.id for update;
 perform public.appointment_expire(c.id);
 if p_expected is distinct from c.revision then raise exception 'La configuración cambió. Recarga y compara antes de guardar.' using errcode='40001';end if;
 if jsonb_typeof(p_data)<>'object' or length(p_data::text)>14000 then raise exception 'Configuración inválida' using errcode='22023';end if;
 if p_action='settings' then
  if exists(select 1 from jsonb_object_keys(p_data) k where k not in('enabled','durations','buffer_minutes','hold_hours','minimum_notice_minutes','booking_horizon_days','max_daily_appointments','modalities','meeting_locations','cancellation_minutes','reminder_24h','reminder_day','reminder_time','owner_whatsapp_opt_in','retention_days')) then raise exception 'Campo reservado' using errcode='22023';end if;
  for field in select jsonb_object_keys(p_data) loop
   if(field in('enabled','reminder_24h','reminder_day','owner_whatsapp_opt_in') and jsonb_typeof(p_data->field)<>'boolean') or
    (field in('buffer_minutes','hold_hours','minimum_notice_minutes','booking_horizon_days','max_daily_appointments','cancellation_minutes','retention_days') and(jsonb_typeof(p_data->field)<>'number' or(p_data->>field)!~'^[0-9]+$')) or
    (field in('durations') and jsonb_typeof(p_data->field)<>'object') or
    (field in('modalities','meeting_locations') and jsonb_typeof(p_data->field)<>'array') or
    (field='reminder_time' and(jsonb_typeof(p_data->field)<>'string' or(p_data->>field)!~'^[0-9]{2}:[0-9]{2}(:[0-9]{2})?$')) then raise exception 'Tipo de configuración inválido' using errcode='22023';end if;
  end loop;
  v:=jsonb_populate_record(c,p_data);
  reminders_changed:=v.reminder_24h is distinct from c.reminder_24h or v.reminder_day is distinct from c.reminder_day or v.reminder_time is distinct from c.reminder_time;
  if jsonb_typeof(v.durations)<>'object' or not(v.durations ?& array['property_visit','buy','rent','invest','general']) or
   exists(select 1 from jsonb_each(v.durations) e where e.key not in('property_visit','buy','rent','invest','general') or jsonb_typeof(e.value)<>'number' or e.value::text !~ '^[0-9]+$') then raise exception 'Duraciones inválidas' using errcode='22023';end if;
  for field in select jsonb_object_keys(v.durations) loop
   if (v.durations->>field)::integer not between 30 and 480 or mod((v.durations->>field)::integer,15)<>0 then raise exception 'La duración debe ser de 30 a 480 minutos, en intervalos de 15' using errcode='22023';end if;
  end loop;
  if jsonb_typeof(v.meeting_locations)<>'array' or jsonb_array_length(v.meeting_locations)>12
   or exists(select 1 from jsonb_array_elements(v.meeting_locations) x where jsonb_typeof(x)<>'string' or length(x#>>'{}') not between 3 and 240) then raise exception 'Lugares inválidos' using errcode='22023';end if;
  if v.enabled and (c.owner_user_id is null or not exists(select 1 from public.appointment_access_grants g join auth.users u on u.id=g.user_id
   where g.calendar_id=c.id and g.kind='owner' and g.user_id=c.owner_user_id and g.revoked_at is null and u.email_confirmed_at is not null and lower(u.email)=lower(c.email))
   or not exists(select 1 from public.appointment_availability_rules where calendar_id=c.id and enabled)
   or not exists(select 1 from public.appointment_runtime where server_secret_hash is not null)) then raise exception 'Configura primero propietario verificado, disponibilidad y servicio seguro' using errcode='55000';end if;
  update public.appointment_settings set enabled=v.enabled,durations=v.durations,buffer_minutes=v.buffer_minutes,hold_hours=v.hold_hours,
   minimum_notice_minutes=v.minimum_notice_minutes,booking_horizon_days=v.booking_horizon_days,max_daily_appointments=v.max_daily_appointments,
   modalities=v.modalities,meeting_locations=v.meeting_locations,cancellation_minutes=v.cancellation_minutes,reminder_24h=v.reminder_24h,
   reminder_day=v.reminder_day,reminder_time=v.reminder_time,owner_whatsapp_opt_in=v.owner_whatsapp_opt_in,owner_whatsapp_opt_in_at=case when v.owner_whatsapp_opt_in then coalesce(c.owner_whatsapp_opt_in_at,now()) else null end,retention_days=v.retention_days
   where id=c.id;
 elsif p_action='rule_save' then
  if exists(select 1 from jsonb_object_keys(p_data) k where k not in('id','weekday','on_date','starts_at','ends_at','enabled')) then raise exception 'Regla inválida' using errcode='22023';end if;
  r:=jsonb_populate_record(null::public.appointment_availability_rules,p_data);r.id:=coalesce(r.id,gen_random_uuid());
  if exists(select 1 from public.appointment_availability_rules where id=r.id and calendar_id<>c.id) then raise exception 'Regla ajena' using errcode='42501';end if;
  insert into public.appointment_availability_rules(id,calendar_id,weekday,on_date,starts_at,ends_at,enabled)
   values(r.id,c.id,r.weekday,r.on_date,r.starts_at,r.ends_at,coalesce(r.enabled,true))
   on conflict(id) do update set weekday=excluded.weekday,on_date=excluded.on_date,starts_at=excluded.starts_at,ends_at=excluded.ends_at,enabled=excluded.enabled;
 elsif p_action='blackout_save' then
  if exists(select 1 from jsonb_object_keys(p_data) k where k not in('id','label','starts_at','ends_at','weekday','start_time','end_time','valid_from','valid_until','enabled')) then raise exception 'Bloqueo inválido' using errcode='22023';end if;
  b:=jsonb_populate_record(null::public.appointment_blackouts,p_data);b.id:=coalesce(b.id,gen_random_uuid());
  if exists(select 1 from public.appointment_blackouts where id=b.id and calendar_id<>c.id) then raise exception 'Bloqueo ajeno' using errcode='42501';end if;
  if b.starts_at is not null and b.ends_at>b.starts_at+interval '366 days' then raise exception 'El bloqueo debe ser de un año o menos' using errcode='22023';end if;
  insert into public.appointment_blackouts(id,calendar_id,label,starts_at,ends_at,weekday,start_time,end_time,valid_from,valid_until,enabled)
   values(b.id,c.id,b.label,b.starts_at,b.ends_at,b.weekday,b.start_time,b.end_time,b.valid_from,b.valid_until,coalesce(b.enabled,true))
   on conflict(id) do update set label=excluded.label,starts_at=excluded.starts_at,ends_at=excluded.ends_at,weekday=excluded.weekday,
    start_time=excluded.start_time,end_time=excluded.end_time,valid_from=excluded.valid_from,valid_until=excluded.valid_until,enabled=excluded.enabled;
  if exists(select 1 from public.appointment_reservations where calendar_id=c.id and active and public.appointment_blackout_overlap(c.id,lower(occupied),upper(occupied))) then raise exception 'El bloqueo coincide con una reserva. Resuelve la cita antes de bloquear.' using errcode='23P01';end if;
 elsif p_action in('rule_remove','blackout_remove') then
  target_id:=(p_data->>'id')::uuid;
  if p_action='rule_remove' then delete from public.appointment_availability_rules where id=target_id and calendar_id=c.id;
  else delete from public.appointment_blackouts where id=target_id and calendar_id=c.id;end if;
 else raise exception 'Acción inválida' using errcode='22023';end if;
 update public.appointment_settings set revision=revision+1,updated_at=now() where id=c.id returning * into c;
 if not c.owner_whatsapp_opt_in then update public.notification_jobs set status='cancelled',last_error='consent_withdrawn' where calendar_id=c.id and channel='whatsapp' and recipient='owner' and status in('pending','retry','blocked');else perform public.appointment_refresh_whatsapp(c.id);end if;
 if reminders_changed then
  for scheduled in select * from public.appointments where calendar_id=c.id and starts_at>now() and (status='confirmed' or(status in('change_proposed','reschedule_requested') and proposal_base_status='confirmed')) loop
   update public.notification_jobs set status='cancelled',last_error='reminder_policy_changed' where appointment_id=scheduled.id and event like 'reminder_%' and status in('pending','retry','blocked');
   perform public.appointment_schedule_reminders(scheduled.id);
  end loop;
 end if;
 perform public.appointment_log(c.id,null,null,p_action,null,null,jsonb_build_object('revision',c.revision,'ownerWhatsappOptIn',c.owner_whatsapp_opt_in));
 return jsonb_build_object('revision',c.revision);
end $$;

create or replace function public.appointment_propose(p_id uuid,p_start timestamptz,p_actor text)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.appointments; c public.appointment_settings; pr public.appointment_proposals; duration_minutes integer; expiry timestamptz;
begin
 select * into a from public.appointments where id=p_id for update;select * into c from public.appointment_settings where id=a.calendar_id;
 if a.status not in('pending','confirmed') or p_actor not in('thony','client') then raise exception 'La cita no permite una nueva propuesta' using errcode='55000';end if;
 if p_actor='client' and a.status<>'confirmed' then raise exception 'Solo puedes reprogramar una cita confirmada' using errcode='55000';end if;
 if p_start=a.starts_at then raise exception 'Selecciona otra fecha u hora' using errcode='22023';end if;
 duration_minutes:=extract(epoch from(a.ends_at-a.starts_at))::integer/60;
 if not public.appointment_slot_valid(c.id,a.kind,a.modality,p_start,a.id,duration_minutes,a.buffer_minutes) then raise exception 'El nuevo horario no está disponible' using errcode='23P01';end if;
 expiry:=least(now()+make_interval(hours=>c.hold_hours),p_start-interval '15 minutes');
 if a.status='pending' then expiry:=least(expiry,a.hold_expires_at);end if;
 insert into public.appointment_proposals(appointment_id,calendar_id,starts_at,ends_at,buffer_minutes,expires_at,initiated_by,created_by)
  values(a.id,c.id,p_start,p_start+make_interval(mins=>duration_minutes),a.buffer_minutes,expiry,p_actor,auth.uid()) returning * into pr;
 insert into public.appointment_reservations(calendar_id,appointment_id,proposal_id,kind,occupied)
  values(c.id,a.id,pr.id,'proposal',tstzrange(pr.starts_at,pr.ends_at+make_interval(mins=>pr.buffer_minutes),'[)'));
 update public.appointments set status=case when p_actor='client' then 'reschedule_requested' else 'change_proposed' end,
  proposal_base_status=a.status,version=version+1,updated_at=now() where id=a.id;
 perform public.appointment_log(c.id,a.id,a.lead_id,'proposal_created',a.status,case when p_actor='client' then 'reschedule_requested' else 'change_proposed' end,
  jsonb_build_object('proposalId',pr.id,'startsAt',pr.starts_at),p_actor);
 perform public.appointment_queue_event(a.id,'proposal',now(),pr.id);
 return pr.id;
end $$;
create or replace function public.appointment_resolve_proposal(p_id uuid,p_accept boolean,p_actor text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.appointments; pr public.appointment_proposals; restored text;
begin
 select * into a from public.appointments where id=p_id for update;
 select * into pr from public.appointment_proposals where appointment_id=a.id and status='pending' for update;
 if pr.id is null or pr.expires_at<=now() or a.status not in('change_proposed','reschedule_requested') then raise exception 'La propuesta ya no está vigente' using errcode='55000';end if;
 if p_accept and ((pr.initiated_by='thony' and p_actor<>'client') or(pr.initiated_by='client' and p_actor<>'thony')) then raise exception 'Falta la aceptación de la otra parte' using errcode='42501';end if;
 if p_accept then
  if not exists(select 1 from public.appointment_reservations where proposal_id=pr.id and active)
   or public.appointment_blackout_overlap(a.calendar_id,pr.starts_at,pr.ends_at+make_interval(mins=>pr.buffer_minutes)) then raise exception 'La propuesta tiene un conflicto' using errcode='23P01';end if;
  update public.appointment_reservations set active=false where appointment_id=a.id and active;
  insert into public.appointment_reservations(calendar_id,appointment_id,kind,occupied)
   values(a.calendar_id,a.id,'main',tstzrange(pr.starts_at,pr.ends_at+make_interval(mins=>pr.buffer_minutes),'[)'));
  update public.appointment_proposals set status='accepted',resolved_at=now() where id=pr.id;
  update public.appointments set starts_at=pr.starts_at,ends_at=pr.ends_at,buffer_minutes=pr.buffer_minutes,status='confirmed',
   proposal_base_status=null,confirmed_at=coalesce(confirmed_at,now()),version=version+1,schedule_version=schedule_version+1,updated_at=now() where id=a.id;
  update public.notification_jobs set status='cancelled',last_error='rescheduled',updated_at=now() where appointment_id=a.id and status in('pending','retry','blocked');
  perform public.appointment_queue_event(a.id,'rescheduled');perform public.appointment_schedule_reminders(a.id);
  perform public.appointment_log(a.calendar_id,a.id,a.lead_id,'rescheduled',a.status,'confirmed',jsonb_build_object('proposalId',pr.id,'oldStartsAt',a.starts_at,'startsAt',pr.starts_at),p_actor);
 else
  restored:=a.proposal_base_status;
  update public.appointment_proposals set status=case when pr.initiated_by=p_actor then 'withdrawn' else 'declined' end,resolved_at=now() where id=pr.id;
  update public.appointment_reservations set active=false where proposal_id=pr.id;
  update public.appointments set status=restored,proposal_base_status=null,version=version+1,updated_at=now() where id=a.id;
  update public.notification_jobs set status='cancelled',last_error='proposal_declined',updated_at=now() where appointment_id=a.id and event='proposal' and status in('pending','retry','blocked');
  perform public.appointment_queue_event(a.id,'proposal_declined');
  perform public.appointment_log(a.calendar_id,a.id,a.lead_id,'proposal_declined',a.status,restored,jsonb_build_object('proposalId',pr.id),p_actor);
 end if;
 update public.leads set last_interaction_at=now(),version=version+1 where id=a.lead_id;
end $$;
create or replace function public.appointment_admin_action(p_id uuid,p_action text,p_expected integer,p_data jsonb default '{}')
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.appointments; c public.appointment_settings; next_status text;
begin
 select * into c from public.appointment_settings where slug='thony';perform public.appointment_require(c.id);
 perform public.appointment_lock(c.id);perform public.appointment_expire(c.id);
 select * into a from public.appointments where id=p_id and calendar_id=c.id for update;
 if a.id is null then raise exception 'Solicitud no encontrada' using errcode='P0002';end if;
 if a.version is distinct from p_expected then raise exception 'La solicitud cambió. Recarga antes de actuar.' using errcode='40001';end if;
 if jsonb_typeof(p_data)<>'object' or length(p_data::text)>7000 or exists(select 1 from jsonb_object_keys(p_data) k where k not in('note','instructions','startsAt'))
  or length(coalesce(p_data->>'note',''))>2000 or length(coalesce(p_data->>'instructions',''))>1500 then raise exception 'Datos inválidos' using errcode='22023';end if;
 if p_action='note' then
  if length(trim(coalesce(p_data->>'note','')))<1 then raise exception 'Escribe la nota privada' using errcode='22023';end if;
  perform public.appointment_log(c.id,a.id,a.lead_id,'note',a.status,a.status,jsonb_build_object('note',p_data->>'note'));
  update public.appointments set version=version+1,updated_at=now() where id=a.id;
 elsif p_action='propose' then
  if length(trim(coalesce(p_data->>'instructions',a.instructions)))<3 then raise exception 'Confirma el lugar o instrucciones antes de proponer' using errcode='22023';end if;
  update public.appointments set instructions=coalesce(p_data->>'instructions',instructions) where id=a.id;
  perform public.appointment_propose(a.id,(p_data->>'startsAt')::timestamptz,'thony');
 elsif p_action in('accept_proposal','decline_proposal') then perform public.appointment_resolve_proposal(a.id,p_action='accept_proposal','thony');
 else
  next_status:=case p_action when 'confirm' then 'confirmed' when 'reject' then 'rejected' when 'cancel' then 'cancelled_thony' when 'complete' then 'completed' when 'no_show' then 'no_show' else null end;
  if next_status is null then raise exception 'Acción inválida' using errcode='22023';end if;
  if (p_action in('confirm','reject') and a.status<>'pending')
   or(p_action='cancel' and a.status not in('pending','confirmed','change_proposed','reschedule_requested'))
   or(p_action in('complete','no_show') and a.status<>'confirmed') then raise exception 'Transición de estado no permitida' using errcode='55000';end if;
  if p_action='reject' and length(trim(coalesce(p_data->>'note','')))<3 then raise exception 'Registra el motivo interno del rechazo' using errcode='22023';end if;
  if p_action='confirm' and (a.hold_expires_at<=now() or not exists(select 1 from public.appointment_reservations where appointment_id=a.id and kind='main' and active)) then raise exception 'La reserva provisional venció' using errcode='55000';end if;
  if p_action='confirm' and (public.appointment_blackout_overlap(c.id,a.starts_at,a.ends_at+make_interval(mins=>a.buffer_minutes)) or not exists(select 1 from public.appointment_reservations where appointment_id=a.id and active and kind='main' and occupied=tstzrange(a.starts_at,a.ends_at+make_interval(mins=>a.buffer_minutes),'[)'))) then raise exception 'El intervalo reservado tiene un conflicto' using errcode='23P01';end if;
  if p_action='confirm' and length(trim(coalesce(p_data->>'instructions','')))<3 then raise exception 'Confirma las instrucciones de la cita' using errcode='22023';end if;
  if p_action='complete' and now()<a.ends_at then raise exception 'La cita aún no ha finalizado' using errcode='55000';end if;
  if p_action='no_show' and now()<a.starts_at+interval '15 minutes' then raise exception 'Espera al menos 15 minutos después del inicio' using errcode='55000';end if;
  update public.appointments set status=next_status,proposal_base_status=null,confirmed_at=case when p_action='confirm' then now() else confirmed_at end,
   instructions=case when p_action='confirm' then p_data->>'instructions' else instructions end,version=version+1,
   schedule_version=schedule_version+case when p_action='confirm' then 0 else 1 end,updated_at=now() where id=a.id;
  if p_action<>'confirm' then
   update public.appointment_reservations set active=false where appointment_id=a.id;
   update public.appointment_proposals set status='withdrawn',resolved_at=now() where appointment_id=a.id and status='pending';
  end if;
  update public.notification_jobs set status='cancelled',last_error='state_changed',updated_at=now() where appointment_id=a.id and status in('pending','retry','blocked');
  perform public.appointment_log(c.id,a.id,a.lead_id,p_action,a.status,next_status,jsonb_build_object('note',coalesce(p_data->>'note','')));
  perform public.appointment_queue_event(a.id,next_status);
  if p_action='confirm' then perform public.appointment_schedule_reminders(a.id);end if;
 end if;
 update public.leads set last_interaction_at=now(),version=version+1 where id=a.lead_id;
 return(select jsonb_build_object('id',id,'status',status,'version',version) from public.appointments where id=a.id);
end $$;
create or replace function public.appointment_customer(p_secret text,p_grant jsonb,p_action text default 'read',p_data jsonb default '{}')
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare g public.appointment_customer_grants; a public.appointments; c public.appointment_settings; l public.leads; pr public.appointment_proposals;
begin
 perform public.appointment_server_require(p_secret);
 select * into g from public.appointment_customer_grants where id=(p_grant->>'id')::uuid and nonce=(p_grant->>'nonce')::uuid
  and extract(epoch from expires_at)::bigint=(p_grant->>'expiresAt')::bigint and expires_at>now() and revoked_at is null;
 if g.id is null or not((case when p_action='read' then 'read' when p_action='cancel' then 'cancel' when p_action='calendar' then 'calendar' when p_action='preferences' then 'preferences' else 'propose' end)=any(g.scopes)) then raise exception 'El enlace no es válido o venció' using errcode='42501';end if;
 select * into a from public.appointments where id=g.appointment_id;
 perform public.appointment_lock(a.calendar_id);
 select * into g from public.appointment_customer_grants where id=g.id and nonce=g.nonce and revoked_at is null and expires_at>now() for update;
 if g.id is null then raise exception 'El enlace ya no está disponible' using errcode='42501';end if;
 perform public.appointment_expire(a.calendar_id);
 select * into a from public.appointments where id=g.appointment_id for update;
 select * into c from public.appointment_settings where id=a.calendar_id;select * into l from public.leads where id=a.lead_id;
 if l.anonymized_at is not null then raise exception 'El enlace ya no está disponible' using errcode='42501';end if;
 if p_action='preferences' then
  if jsonb_typeof(p_data->'whatsappConsent') is distinct from 'boolean' or coalesce(p_data->>'communicationPreference','') not in('email','whatsapp','both') or(p_data->>'communicationPreference'<>'email' and p_data->'whatsappConsent'<>'true'::jsonb) then raise exception 'Revisa tu autorización de WhatsApp' using errcode='22023';end if;
  update public.leads set whatsapp_consent_at=case when p_data->'whatsappConsent'='true'::jsonb then coalesce(whatsapp_consent_at,now()) else null end,communication_preference=p_data->>'communicationPreference',last_interaction_at=now(),version=version+1 where id=l.id returning * into l;
  if l.whatsapp_consent_at is null then
   update public.notification_jobs set status='cancelled',last_error='consent_withdrawn' where appointment_id in(select id from public.appointments where lead_id=l.id) and channel='whatsapp' and recipient='client' and status in('pending','retry','blocked');
  else perform public.appointment_refresh_whatsapp(c.id,l.id);end if;
  perform public.appointment_log(c.id,a.id,l.id,'communication_preferences',null,null,jsonb_build_object('whatsapp',l.whatsapp_consent_at is not null),'client');
 elsif p_action='cancel' then
  if a.status not in('pending','confirmed','change_proposed','reschedule_requested') then raise exception 'La solicitud ya no permite cancelación' using errcode='55000';end if;
  if a.confirmed_at is not null and a.starts_at<now()+make_interval(mins=>c.cancellation_minutes) then raise exception 'Para cancelar con esta anticipación, contacta directamente con Thony' using errcode='55000';end if;
  update public.appointments set status='cancelled_client',proposal_base_status=null,version=version+1,schedule_version=schedule_version+1,updated_at=now() where id=a.id;
  update public.appointment_reservations set active=false where appointment_id=a.id;
  update public.appointment_proposals set status='withdrawn',resolved_at=now() where appointment_id=a.id and status='pending';
  update public.notification_jobs set status='cancelled',last_error='cancelled_by_client',updated_at=now() where appointment_id=a.id and status in('pending','retry','blocked');
  perform public.appointment_log(c.id,a.id,l.id,'cancelled_client',a.status,'cancelled_client','{}','client');
  perform public.appointment_queue_event(a.id,'cancelled_client');
 elsif p_action='propose' then
  if a.starts_at<now()+make_interval(mins=>c.cancellation_minutes) then raise exception 'Contacta con Thony para cambiar esta cita' using errcode='55000';end if;
  perform public.appointment_propose(a.id,(p_data->>'startsAt')::timestamptz,'client');
 elsif p_action in('accept_proposal','decline_proposal') then
  perform public.appointment_resolve_proposal(a.id,p_action='accept_proposal','client');
 elsif p_action not in('read','calendar') then raise exception 'Acción no permitida' using errcode='22023';end if;
 select * into a from public.appointments where id=a.id;
 select * into pr from public.appointment_proposals where appointment_id=a.id and status='pending';
 return jsonb_build_object('id',a.id,'name',l.name,'email',l.email,'phone',l.phone,'kind',a.kind,'modality',a.modality,
 'startsAt',a.starts_at,'endsAt',a.ends_at,'status',a.status,'baseStatus',a.proposal_base_status,'expiresAt',a.hold_expires_at,
 'instructions',case when a.confirmed_at is not null or a.status='change_proposed' then a.instructions else '' end,
 'property',a.property_snapshot,'sequence',a.schedule_version,'updatedAt',a.updated_at,'cancellationMinutes',c.cancellation_minutes,'communicationPreference',l.communication_preference,'whatsappConsent',l.whatsapp_consent_at is not null,
 'proposal',case when pr.id is null then null else jsonb_build_object('id',pr.id,'startsAt',pr.starts_at,'endsAt',pr.ends_at,'expiresAt',pr.expires_at,'initiatedBy',pr.initiated_by) end,
 'history',(select coalesce(jsonb_agg(jsonb_build_object('event',event,'createdAt',created_at,'status',to_status) order by created_at),'[]'::jsonb)
  from public.appointment_history where appointment_id=a.id and event in('requested','confirm','reject','cancel','cancelled_client','rescheduled','proposal_created','proposal_declined','proposal_expired','expired','complete','no_show')));
end $$;
create or replace function public.appointment_admin_slots(p_day date,p_id uuid default null,p_kind text default 'general',p_modality text default 'presencial')
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.appointment_settings; a public.appointments; duration_minutes integer; result jsonb;
begin
 select * into c from public.appointment_settings where slug='thony';perform public.appointment_require(c.id);perform public.appointment_expire(c.id);
 if p_day is null or p_day<(now() at time zone c.timezone)::date or p_day>(now() at time zone c.timezone)::date+c.booking_horizon_days then return '[]'::jsonb;end if;
 if p_id is not null then
  select * into a from public.appointments where id=p_id and calendar_id=c.id;
  if a.id is null then raise exception 'Cita ajena o inexistente' using errcode='42501';end if;
  p_kind:=a.kind;p_modality:=a.modality;duration_minutes:=extract(epoch from(a.ends_at-a.starts_at))::integer/60;
 else duration_minutes:=(c.durations->>p_kind)::integer;end if;
 select coalesce(jsonb_agg(jsonb_build_object('startsAt',v,'endsAt',v+make_interval(mins=>duration_minutes)) order by v),'[]'::jsonb)
 into result from generate_series(p_day::timestamp at time zone c.timezone,(p_day::timestamp+interval '23 hours 30 minutes') at time zone c.timezone,interval '30 minutes') v
 where public.appointment_slot_valid(c.id,p_kind,p_modality,v,p_id,duration_minutes,coalesce(a.buffer_minutes,c.buffer_minutes));
 return result;
end $$;
create or replace function public.appointment_workspace(p_kind text default 'appointments',p_from timestamptz default now()-interval '30 days',p_until timestamptz default now()+interval '90 days',p_page integer default 0)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.appointment_settings; result jsonb; allowed_leads boolean;
begin
 select * into c from public.appointment_settings where slug='thony';
 perform public.appointment_require(c.id,case when p_kind='leads' then 'leads' else 'manage' end);
 if p_kind not in('appointments','leads','settings') or p_until<=p_from or p_until-p_from>interval '400 days' or p_page not between 0 and 10000 then raise exception 'Consulta inválida' using errcode='22023';end if;
 perform public.appointment_expire(c.id);allowed_leads:=public.appointment_permission(c.id,'leads');
 result:=jsonb_build_object('access',public.appointment_access(),'settings',to_jsonb(c),
 'rules',(select coalesce(jsonb_agg(r order by weekday,starts_at),'[]') from public.appointment_availability_rules r where calendar_id=c.id),
 'blackouts',(select coalesce(jsonb_agg(b order by created_order),'[]') from(select b.*,coalesce(b.starts_at,b.valid_from::timestamp at time zone c.timezone) created_order from public.appointment_blackouts b where calendar_id=c.id) b),
 'runtime',(select jsonb_build_object('lastWorkerAt',last_worker_at,'schedulerEnabledAt',scheduler_enabled_at,'lastWorkerError',last_worker_error,'serverConfigured',server_secret_hash is not null) from public.appointment_runtime where id=1));
 if p_kind='settings' then
  if public.appointment_permission(c.id,'permissions') then result:=result||jsonb_build_object('grants',
   (select coalesce(jsonb_agg(g),'[]') from public.appointment_access_grants g where calendar_id=c.id));end if;
  return result;
 end if;
 result:=result||jsonb_build_object('appointments',(
  select coalesce(jsonb_agg(row order by row->>'starts_at'),'[]') from(
   select to_jsonb(a)||jsonb_build_object('client',jsonb_build_object('id',l.id,'name',l.name,'email',l.email,'phone',l.phone,'preference',l.communication_preference,'whatsappConsent',l.whatsapp_consent_at is not null),
    'proposals',(select coalesce(jsonb_agg(p order by created_at desc),'[]') from public.appointment_proposals p where appointment_id=a.id),
    'history','[]'::jsonb) row
   from public.appointments a join public.leads l on l.id=a.lead_id where a.calendar_id=c.id
    and (a.starts_at between p_from and p_until or a.status in('pending','change_proposed','reschedule_requested'))
   order by a.starts_at limit 300 offset(p_page*300)) selected),
 'appointmentTotal',(select count(*) from public.appointments where calendar_id=c.id and starts_at between p_from and p_until),
 'metrics',(select jsonb_build_object(
  'pending',count(*) filter(where status='pending'),'today',count(*) filter(where (starts_at at time zone c.timezone)::date=(now() at time zone c.timezone)::date and status in('confirmed','change_proposed','reschedule_requested')),
  'tomorrow',count(*) filter(where (starts_at at time zone c.timezone)::date=(now() at time zone c.timezone)::date+1 and status in('confirmed','change_proposed','reschedule_requested')),
  'confirmed',count(*) filter(where status='confirmed' and starts_at>now()),'rejected',count(*) filter(where status='rejected'),
  'completed',count(*) filter(where status='completed'),'cancelled',count(*) filter(where status in('cancelled_client','cancelled_thony')),
  'leads',case when allowed_leads then(select count(*) from public.leads where calendar_id=c.id and anonymized_at is null) else null end)
  from public.appointments where calendar_id=c.id));
 if public.appointment_permission(c.id,'notifications') then result:=result||jsonb_build_object('notifications',(
  select coalesce(jsonb_agg(n order by created_at desc),'[]') from(select id,appointment_id,event,recipient,channel,status,attempts,scheduled_at,sent_at,delivered_at,last_error,provider_id,created_at
  from public.notification_jobs where calendar_id=c.id order by created_at desc limit 250) n),
  'notificationAttempts',(select coalesce(jsonb_agg(x order by started_at desc),'[]') from(select id,job_id,attempt,outcome,provider,provider_id,error_code,started_at,finished_at from public.notification_attempts where calendar_id=c.id order by started_at desc limit 500) x),
  'notificationEvents',(select coalesce(jsonb_agg(x order by occurred_at desc),'[]') from(select e.id,e.job_id,e.provider,e.status,e.occurred_at from public.notification_delivery_events e join public.notification_jobs j on j.id=e.job_id where j.calendar_id=c.id order by occurred_at desc limit 500) x),
  'notificationMetrics',(select jsonb_build_object('pending',count(*) filter(where status in('pending','retry','processing','blocked')),
  'errors',count(*) filter(where status in('failed','uncertain','blocked'))) from public.notification_jobs where calendar_id=c.id));end if;
 if p_kind='leads' then result:=result||public.appointment_search_leads('',null,null,null,null,'newest',p_page);end if;
 if p_kind='leads' and not public.appointment_permission(c.id) then result:=result-array['settings','rules','blackouts','runtime'];end if;
 return result;
end $$;
create or replace function public.appointment_lead_action(p_id uuid,p_action text,p_data jsonb,p_expected integer default null)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare l public.leads; c public.appointment_settings; target_lead uuid; a public.appointments;
begin
 select * into c from public.appointment_settings where slug='thony';perform public.appointment_require(c.id,'leads');perform public.appointment_lock(c.id);
 select * into l from public.leads where id=p_id and calendar_id=c.id for update;
 if l.id is null or l.anonymized_at is not null then raise exception 'Cliente no disponible' using errcode='P0002';end if;
 if p_expected is distinct from l.version then raise exception 'La ficha cambió. Recarga antes de guardar.' using errcode='40001';end if;
 if jsonb_typeof(p_data)<>'object' or length(p_data::text)>6500 then raise exception 'Datos inválidos' using errcode='22023';end if;
 if p_action='status' then
  update public.leads set commercial_status=p_data->>'status' where id=l.id;
 elsif p_action='note' then
  insert into public.lead_notes(lead_id,calendar_id,author_id,body) values(l.id,c.id,auth.uid(),trim(p_data->>'body'));
 elsif p_action='task' then
  insert into public.lead_tasks(lead_id,calendar_id,author_id,title,due_at) values(l.id,c.id,auth.uid(),trim(p_data->>'title'),(p_data->>'dueAt')::timestamptz);
 elsif p_action='task_status' then
  update public.lead_tasks set status=p_data->>'status' where id=(p_data->>'id')::uuid and lead_id=l.id and calendar_id=c.id;
  if not found then raise exception 'Tarea ajena o inexistente' using errcode='42501';end if;
 elsif p_action='link_appointment' then
  target_lead:=(p_data->>'targetLeadId')::uuid;
  if not exists(select 1 from public.leads where id=target_lead and calendar_id=c.id and anonymized_at is null) then raise exception 'Cliente de destino no autorizado' using errcode='42501';end if;
  select * into a from public.appointments where id=(p_data->>'appointmentId')::uuid and lead_id=l.id and calendar_id=c.id for update;
  if a.id is null or a.status in('pending','confirmed','change_proposed','reschedule_requested') then raise exception 'Relaciona únicamente solicitudes finalizadas; las citas activas conservan su consentimiento original' using errcode='55000';end if;
  update public.appointment_customer_grants set revoked_at=now() where appointment_id=a.id;
  update public.notification_jobs set status='cancelled',last_error='lead_reassigned',payload='{}' where appointment_id=a.id and status in('pending','processing','retry','blocked','uncertain');
  update public.appointments set lead_id=target_lead,version=version+1 where id=a.id;
  perform public.appointment_log(c.id,a.id,target_lead,'lead_linked',null,null,jsonb_build_object('sourceLeadId',l.id));
 elsif p_action='anonymize' then
  if p_data->>'confirmation'<>'ELIMINAR DATOS PERSONALES' then raise exception 'Confirmación explícita requerida' using errcode='22023';end if;
  if exists(select 1 from public.appointments where lead_id=l.id and status in('pending','confirmed','change_proposed','reschedule_requested')) then raise exception 'Resuelve primero las citas activas' using errcode='55000';end if;
  perform public.appointment_anonymize(l.id);
 else raise exception 'Acción no permitida' using errcode='22023';end if;
 update public.leads set last_interaction_at=now(),version=version+1 where id=l.id;
 perform public.appointment_log(c.id,null,l.id,'lead_'||p_action,null,null,
  case when p_action='status' then jsonb_build_object('status',p_data->>'status') else '{}'::jsonb end);
end $$;
create or replace function public.appointment_anonymize(p_lead uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 update public.appointment_customer_grants set revoked_at=now() where appointment_id in(select id from public.appointments where lead_id=p_lead);
 update public.notification_jobs set payload='{}',status=case when status in('pending','processing','retry','blocked','uncertain') then 'cancelled' else status end,last_error=null
  where appointment_id in(select id from public.appointments where lead_id=p_lead);
 update public.appointments set comments='',instructions='' where lead_id=p_lead;
 delete from public.lead_notes where lead_id=p_lead;delete from public.lead_tasks where lead_id=p_lead;
 update public.appointment_history set details='{}' where lead_id=p_lead;
 update public.leads set name='Datos personales eliminados',email=null,phone=null,anonymized_at=now() where id=p_lead;
end $$;
create or replace function public.appointment_grant_action(p_user uuid,p_revoke boolean,p_permissions jsonb default '{}')
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.appointment_settings;
begin
 select * into c from public.appointment_settings where slug='thony';perform public.appointment_require(c.id,'permissions');
 if p_user=c.owner_user_id or(not p_revoke and not exists(select 1 from public.platform_superadmins s join auth.users u on u.id=s.user_id where s.user_id=p_user and u.email_confirmed_at is not null)) or(p_revoke and not exists(select 1 from public.appointment_access_grants where calendar_id=c.id and user_id=p_user and kind='technical')) then raise exception 'Solo puedes autorizar superadministradores técnicos verificados; el propietario se configura por SQL' using errcode='42501';end if;
 if jsonb_typeof(p_permissions)<>'object' or exists(select 1 from jsonb_each(p_permissions) e where e.key not in('manage','leads','export','permissions','notifications') or jsonb_typeof(e.value)<>'boolean') then raise exception 'Permisos inválidos' using errcode='22023';end if;
 insert into public.appointment_access_grants(calendar_id,user_id,kind,can_manage,can_read_leads,can_export,can_manage_permissions,can_view_notifications,authorized_by,revoked_at)
 values(c.id,p_user,'technical',coalesce((p_permissions->>'manage')::boolean,false),coalesce((p_permissions->>'leads')::boolean,false),coalesce((p_permissions->>'export')::boolean,false),
 coalesce((p_permissions->>'permissions')::boolean,false),coalesce((p_permissions->>'notifications')::boolean,false),auth.uid(),case when p_revoke then now() else null end)
 on conflict(calendar_id,user_id) do update set can_manage=excluded.can_manage,can_read_leads=excluded.can_read_leads,can_export=excluded.can_export,
 can_manage_permissions=excluded.can_manage_permissions,can_view_notifications=excluded.can_view_notifications,authorized_by=auth.uid(),authorized_at=now(),revoked_at=excluded.revoked_at;
 perform public.appointment_log(c.id,null,null,case when p_revoke then 'access_revoked' else 'access_granted' end,null,null,jsonb_build_object('userId',p_user,'permissions',p_permissions));
end $$;
create or replace function public.appointment_job_valid(p_id uuid)
returns boolean language plpgsql stable security definer set search_path=public,pg_temp as $$
declare j public.notification_jobs; a public.appointments; c public.appointment_settings;
begin
 select * into j from public.notification_jobs where id=p_id;select * into a from public.appointments where id=j.appointment_id;
 if a.id is null or exists(select 1 from public.leads where id=a.lead_id and anonymized_at is not null) then return false;end if;
 if j.channel='whatsapp' then
  if j.recipient='owner' and not exists(select 1 from public.appointment_settings where id=a.calendar_id and owner_whatsapp_opt_in) then return false;end if;
  if j.recipient='client' and not exists(select 1 from public.leads where id=a.lead_id and whatsapp_consent_at is not null) then return false;end if;
 end if;
 if j.valid_until is not null and j.valid_until<=now() then return false;end if;
 if j.event like 'reminder_%' then
  select * into c from public.appointment_settings where id=a.calendar_id;
  if (j.event='reminder_24h' and(not c.reminder_24h or j.scheduled_at<>a.starts_at-interval '24 hours')) or (j.event='reminder_day' and(not c.reminder_day or j.scheduled_at<>least(((a.starts_at at time zone c.timezone)::date+c.reminder_time) at time zone c.timezone,a.starts_at-interval '1 hour'))) then return false;end if;
  return a.confirmed_at is not null and a.starts_at>now()+interval '15 minutes'
  and a.schedule_version=j.schedule_version and (a.status='confirmed' or(a.status in('change_proposed','reschedule_requested') and a.proposal_base_status='confirmed'));end if;
 if j.event='received' then return a.status='pending' and a.hold_expires_at>now();end if;
 if j.event in('confirmed','rescheduled') then return a.starts_at>now() and a.confirmed_at is not null and a.schedule_version=j.schedule_version and a.status in('confirmed','change_proposed','reschedule_requested');end if;
 if j.event='proposal' then return exists(select 1 from public.appointment_proposals where appointment_id=a.id and id=(j.payload->>'proposalId')::uuid and status='pending' and expires_at>now());end if;
 if j.event in('proposal_expired','proposal_declined') then return a.status in('confirmed','pending','expired');end if;
 return j.event=a.status;
end $$;
create or replace function public.appointment_worker_claim(p_secret text,p_limit integer default 10)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.appointment_settings; result jsonb;
begin
 perform public.appointment_server_require(p_secret);select * into c from public.appointment_settings where slug='thony';
 perform public.appointment_expire(c.id);
 update public.appointment_runtime set last_worker_at=now(),last_worker_error=null where id=1;
 update public.notification_attempts attempt_log set outcome=case when j.channel='email' and j.first_attempt_at>now()-interval '23 hours' then 'retry' else 'uncertain' end,error_code='processing_interrupted',finished_at=now() from public.notification_jobs j where attempt_log.claim_token=j.claim_token and j.status='processing' and j.lease_until<=now() and attempt_log.finished_at is null;
 update public.notification_jobs set status=case when channel='email' and first_attempt_at>now()-interval '23 hours' then 'retry' else 'uncertain' end,
  last_error='processing_interrupted',available_at=now(),claim_token=null,lease_until=null,updated_at=now()
  where status='processing' and lease_until<=now();
 update public.notification_jobs set status='cancelled',last_error='event_no_longer_valid',updated_at=now()
  where status in('pending','retry','blocked') and not public.appointment_job_valid(id);
 update public.notification_jobs set status='uncertain',last_error='idempotency_window_elapsed',updated_at=now() where channel='email' and status in('pending','retry') and attempts>0 and first_attempt_at<now()-interval '23 hours';
 update public.notification_jobs set status='failed',last_error='retry_limit_reached',updated_at=now()
  where status in('pending','retry') and attempts>=max_attempts;
 with candidates as(select id from public.notification_jobs where status in('pending','retry','blocked') and attempts<max_attempts
  and scheduled_at<=now() and available_at<=now() order by scheduled_at for update skip locked limit greatest(1,least(p_limit,20))),
 claimed as(update public.notification_jobs j set status='processing',attempts=attempts+1,claim_token=gen_random_uuid(),lease_until=now()+interval '3 minutes',
  first_attempt_at=coalesce(first_attempt_at,now()),updated_at=now() from candidates candidate where j.id=candidate.id returning j.*)
 select coalesce(jsonb_agg(to_jsonb(claimed)),'[]') into result from claimed;
 insert into public.notification_attempts(job_id,calendar_id,claim_token,attempt) select (job->>'id')::uuid,(job->>'calendar_id')::uuid,(job->>'claim_token')::uuid,(job->>'attempts')::integer from jsonb_array_elements(result) job;
 return result;
end $$;
create or replace function public.appointment_worker_prepare(p_secret text,p_id uuid,p_claim uuid)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform public.appointment_server_require(p_secret);
 if not exists(select 1 from public.notification_jobs where id=p_id and status='processing' and claim_token=p_claim and lease_until>now()) then return false;end if;
 if not public.appointment_job_valid(p_id) then
  update public.notification_attempts set outcome='cancelled',error_code='event_no_longer_valid',finished_at=now() where claim_token=p_claim;
  update public.notification_jobs set status='cancelled',last_error='event_no_longer_valid',updated_at=now() where id=p_id and claim_token=p_claim;return false;end if;
 return true;
end $$;
create or replace function public.appointment_worker_finish(p_secret text,p_id uuid,p_claim uuid,p_status text,p_provider text default null,p_provider_id text default null,p_error text default null)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare j public.notification_jobs;
begin
 perform public.appointment_server_require(p_secret);
 select * into j from public.notification_jobs where id=p_id and claim_token=p_claim for update;
 if j.id is null then return;end if;
 if j.status in('delivered','sent') then return;end if;
 if j.status<>'processing' then return;end if;
 if p_status not in('sent','blocked','retry','failed','uncertain') or length(coalesce(p_error,''))>160
  or(p_status='sent' and(coalesce(p_provider,'') not in('resend','meta') or length(coalesce(p_provider_id,'')) not between 3 and 240)) then raise exception 'Resultado de proveedor inválido' using errcode='22023';end if;
 update public.notification_attempts set outcome=p_status,provider=p_provider,provider_id=p_provider_id,error_code=p_error,finished_at=now() where claim_token=p_claim;
 if p_status='retry' and(j.attempts>=j.max_attempts or j.first_attempt_at<now()-interval '23 hours') then p_status:=case when p_error in('provider_network_interrupted','provider_response_invalid') or j.first_attempt_at<now()-interval '23 hours' then 'uncertain' else 'failed' end;end if;
 update public.notification_jobs set status=p_status,provider=p_provider,provider_id=p_provider_id,last_error=p_error,
  attempts=case when p_status='blocked' then greatest(0,attempts-1) else attempts end,
  available_at=now()+case when p_status='blocked' then interval '15 minutes' else make_interval(secs=>least(3600,30*power(2,least(j.attempts,7)))::integer) end,
  sent_at=case when p_status='sent' then now() else sent_at end,
  first_attempt_at=case when p_status='blocked' and j.attempts=1 then null else first_attempt_at end,lease_until=null,updated_at=now() where id=j.id;
end $$;
create or replace function public.appointment_delivery(p_secret text,p_provider text,p_event_id text,p_provider_id text,p_status text,p_job uuid default null,p_claim uuid default null,p_occurred timestamptz default now())
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare j public.notification_jobs; inserted_id uuid;
begin
 perform public.appointment_server_require(p_secret);
 if p_provider not in('meta','resend') or p_status not in('sent','delivered','failed') or length(p_event_id) not between 3 and 400 or length(p_provider_id) not between 3 and 240
 or p_occurred>now()+interval '5 minutes' then raise exception 'Evento de entrega inválido' using errcode='22023';end if;
 select * into j from public.notification_jobs where provider=p_provider and provider_id=p_provider_id for update;
 if j.id is null and p_job is not null then
  select * into j from public.notification_jobs where id=p_job and ((p_provider='meta' and channel='whatsapp' and claim_token=p_claim)
   or(p_provider='resend' and channel='email')) and status in('processing','uncertain','sent','delivered') for update;
 end if;
 if j.id is null then return;end if;
 insert into public.notification_delivery_events(job_id,provider,event_id,provider_id,status,occurred_at)
  values(j.id,p_provider,p_event_id,p_provider_id,p_status,p_occurred) on conflict(provider,event_id) do nothing returning id into inserted_id;
 if inserted_id is null then return;end if;
 update public.notification_attempts set outcome=case when outcome='delivered' then outcome else p_status end,provider=p_provider,provider_id=p_provider_id,finished_at=coalesce(finished_at,now()) where claim_token=j.claim_token;
 if j.status='delivered' or(j.status='cancelled' and j.sent_at is null) then return;end if;
 update public.notification_jobs set provider=p_provider,provider_id=p_provider_id,
  status=case when p_status='delivered' then 'delivered' when p_status='failed' then 'failed' else 'sent' end,
  sent_at=case when p_status in('sent','delivered') then coalesce(sent_at,p_occurred) else sent_at end,
  delivered_at=case when p_status='delivered' then coalesce(delivered_at,p_occurred) else delivered_at end,
  last_error=case when p_status='failed' then 'provider_delivery_failed' else null end,lease_until=null,updated_at=now() where id=j.id;
end $$;
create or replace function public.appointment_worker_cleanup(p_secret text)
returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare l public.leads; count_removed integer:=0;
begin
 perform public.appointment_server_require(p_secret);
 for l in select old_lead.* from public.leads old_lead join public.appointment_settings c on c.id=old_lead.calendar_id
 where old_lead.anonymized_at is null and old_lead.last_interaction_at<now()-make_interval(days=>c.retention_days)
 and not exists(select 1 from public.appointments a where a.lead_id=old_lead.id and a.status in('pending','confirmed','change_proposed','reschedule_requested')) limit 100 loop
  perform public.appointment_lock(l.calendar_id);
  if not exists(select 1 from public.leads fresh join public.appointment_settings c on c.id=fresh.calendar_id
   where fresh.id=l.id and fresh.anonymized_at is null and fresh.last_interaction_at<now()-make_interval(days=>c.retention_days)
   and not exists(select 1 from public.appointments a where a.lead_id=fresh.id and a.status in('pending','confirmed','change_proposed','reschedule_requested'))) then continue;end if;
  perform public.appointment_anonymize(l.id);
  perform public.appointment_log(l.calendar_id,null,l.id,'retention_anonymized',null,null,'{}','system');count_removed:=count_removed+1;
 end loop;
 delete from public.appointment_rate_limits where bucket<now()-interval '2 days';
 delete from public.appointment_customer_grants where expires_at<now()-interval '30 days';
 update public.notification_jobs set payload='{}' where created_at<now()-interval '30 days' and status in('sent','delivered','failed','cancelled');
 return count_removed;
end $$;
create or replace function public.appointment_export()
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.appointment_settings; result jsonb;
begin
 select * into c from public.appointment_settings where slug='thony';perform public.appointment_require(c.id,'export');
 if(select count(*) from public.leads where calendar_id=c.id and anonymized_at is null)>10000 then raise exception 'La exportación supera 10000 fichas; requiere un procedimiento paginado autorizado, no se exporta una lista incompleta.' using errcode='22023';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'email',email,'phone',phone,'commercialStatus',commercial_status,'interest',interest,'firstContactAt',first_contact_at,'lastInteractionAt',last_interaction_at) order by last_interaction_at desc),'[]') into result
 from(select * from public.leads where calendar_id=c.id and anonymized_at is null order by last_interaction_at desc limit 10000) l;
 perform public.appointment_log(c.id,null,null,'leads_exported',null,null,jsonb_build_object('count',jsonb_array_length(result)));
 return result;
end $$;

create or replace function public.appointment_public_properties()
returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',p->>'id','slug',p->>'slug','reference',p->>'reference','title',p->>'title') order by p->>'title'),'[]')
 from jsonb_array_elements(public.public_platform_snapshot()->'properties') p
 where not coalesce((p->>'demo')::boolean,false) and not coalesce((p->>'in_preparation')::boolean,false)
 and exists(select 1 from public.platform_state where id=1 and active_mode='thony')
$$;
create or replace function public.appointment_public_month(p_month date,p_kind text,p_modality text default 'presencial',p_appointment uuid default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.appointment_settings; d date; slots jsonb; result jsonb:='[]';
begin
 select * into c from public.appointment_settings where slug='thony';
 if p_appointment is not null or auth.uid() is not null then perform public.appointment_require(c.id);end if;
 if p_month is null or p_month<>date_trunc('month',p_month)::date or p_month<date_trunc('month',now() at time zone c.timezone)::date or p_month>(now() at time zone c.timezone)::date+c.booking_horizon_days then return result;end if;
 for d in select v::date from generate_series(p_month::timestamp,(p_month+interval '1 month'-interval '1 day')::timestamp,interval '1 day') v loop
  if p_appointment is null then slots:=public.appointment_public_slots(d,p_kind,p_modality);
  else slots:=public.appointment_admin_slots(d,p_appointment,p_kind,p_modality);end if;
  result:=result||jsonb_build_array(jsonb_build_object('date',d,'available',jsonb_array_length(slots)>0,'count',jsonb_array_length(slots)));
 end loop;
 return result;
end $$;
create or replace function public.appointment_customer_availability(p_secret text,p_grant jsonb,p_day date default null,p_month date default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare own jsonb; a public.appointments; c public.appointment_settings; d date; duration_minutes integer; slots jsonb; result jsonb:='[]';
begin
 own:=public.appointment_customer(p_secret,p_grant,'read','{}');
 if not exists(select 1 from public.appointment_customer_grants where id=(p_grant->>'id')::uuid and 'propose'=any(scopes)) then raise exception 'Capacidad insuficiente' using errcode='42501';end if;
 select * into a from public.appointments where id=(own->>'id')::uuid;select * into c from public.appointment_settings where id=a.calendar_id;
 if a.status<>'confirmed' then return result;end if;
 duration_minutes:=extract(epoch from(a.ends_at-a.starts_at))::integer/60;
 if (p_day is null)=(p_month is null) then raise exception 'Selecciona fecha o mes' using errcode='22023';end if;
 if p_month is not null and (p_month<>date_trunc('month',p_month)::date or p_month<date_trunc('month',now() at time zone c.timezone)::date or p_month>(now() at time zone c.timezone)::date+c.booking_horizon_days) then return result;end if;
 for d in select v::date from generate_series(coalesce(p_day,p_month)::timestamp,coalesce(p_day,p_month+interval '1 month'-interval '1 day')::timestamp,interval '1 day') v loop
  if d<(now() at time zone c.timezone)::date or d>(now() at time zone c.timezone)::date+c.booking_horizon_days then slots:='[]';else
  select coalesce(jsonb_agg(jsonb_build_object('startsAt',v,'endsAt',v+make_interval(mins=>duration_minutes)) order by v),'[]') into slots
   from generate_series(d::timestamp at time zone c.timezone,(d::timestamp+interval '23 hours 30 minutes') at time zone c.timezone,interval '30 minutes') v
   where v<>a.starts_at and public.appointment_slot_valid(c.id,a.kind,a.modality,v,a.id,duration_minutes,a.buffer_minutes);
  end if;
  if p_day is not null then return slots;end if;
  result:=result||jsonb_build_array(jsonb_build_object('date',d,'available',jsonb_array_length(slots)>0,'count',jsonb_array_length(slots)));
 end loop;return result;
end $$;
create or replace function public.appointment_lead_detail(p_id uuid,p_page integer default 0)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.appointment_settings; l public.leads;
begin
 select * into c from public.appointment_settings where slug='thony';perform public.appointment_require(c.id,'leads');
 if p_page not between 0 and 10000 then raise exception 'Página inválida' using errcode='22023';end if;
 select * into l from public.leads where id=p_id and calendar_id=c.id;
 if l.id is null then raise exception 'Cliente no encontrado' using errcode='P0002';end if;
 return jsonb_build_object('lead',to_jsonb(l)||jsonb_build_object('duplicateCandidates',(select coalesce(jsonb_agg(candidate),'[]') from(select id,name from public.leads d where d.calendar_id=c.id and d.id<>l.id and d.anonymized_at is null and(d.phone=l.phone or lower(d.email)=lower(l.email)) limit 20) candidate),'appointmentCounts',(select jsonb_build_object('requested',count(*),'confirmed',count(*) filter(where confirmed_at is not null),'completed',count(*) filter(where status='completed')) from public.appointments where lead_id=l.id),'notes',(select coalesce(jsonb_agg(n order by created_at desc),'[]') from public.lead_notes n where lead_id=l.id),'tasks',(select coalesce(jsonb_agg(t order by due_at),'[]') from public.lead_tasks t where lead_id=l.id)),'totalHistory',(select count(*) from public.appointment_history where lead_id=l.id),'totalAppointments',(select count(*) from public.appointments where lead_id=l.id),'appointments',(select coalesce(jsonb_agg(x order by starts_at desc),'[]') from(select * from public.appointments where lead_id=l.id and calendar_id=c.id order by starts_at desc limit 100 offset(p_page*100)) x),
 'history',(select coalesce(jsonb_agg(x order by created_at desc),'[]') from(select * from public.appointment_history where lead_id=l.id and calendar_id=c.id order by created_at desc limit 100 offset(p_page*100)) x));
end $$;

create or replace function public.appointment_search_leads(p_query text default '',p_status text default null,p_from timestamptz default null,p_until timestamptz default null,p_property uuid default null,p_sort text default 'newest',p_page integer default 0)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.appointment_settings; total integer; result jsonb;
begin
 select * into c from public.appointment_settings where slug='thony';perform public.appointment_require(c.id,'leads');
 if length(p_query)>160 or p_sort not in('newest','oldest','name') or p_page not between 0 and 10000 or(p_status is not null and p_status not in('new','contacted','interested','visit_scheduled','follow_up','negotiation','closed','not_interested')) then raise exception 'Filtro inválido' using errcode='22023';end if;
 with filtered as(select l.* from public.leads l where l.calendar_id=c.id
  and (p_status is null or l.commercial_status=p_status)
  and (p_from is null or l.first_contact_at>=p_from) and(p_until is null or l.first_contact_at<p_until)
  and (p_property is null or exists(select 1 from public.appointments a where a.lead_id=l.id and a.calendar_id=c.id and(a.property_id=p_property or a.property_snapshot->>'id'=p_property::text)))
  and (p_query='' or strpos(lower(l.name),lower(p_query))>0 or strpos(lower(coalesce(l.email,'')),lower(p_query))>0
   or(length(regexp_replace(p_query,'[^0-9]','','g'))>=3 and strpos(regexp_replace(coalesce(l.phone,''),'[^0-9]','','g'),regexp_replace(p_query,'[^0-9]','','g'))>0))),
 selected as(select * from filtered order by case when p_sort='oldest' then first_contact_at end asc,case when p_sort='name' then name end asc,case when p_sort='newest' then last_interaction_at end desc,id limit 50 offset(p_page*50)),
 rows as(select to_jsonb(l)||jsonb_build_object('duplicateCandidates',(select coalesce(jsonb_agg(d),'[]') from(select id,name from public.leads d where d.calendar_id=c.id and d.id<>l.id and d.anonymized_at is null and(l.phone=d.phone or lower(l.email)=lower(d.email)) limit 20) d),
 'notes','[]'::jsonb,'tasks','[]'::jsonb,'history','[]'::jsonb,'appointmentCounts',(select jsonb_build_object('requested',count(*),'confirmed',count(*) filter(where confirmed_at is not null),'completed',count(*) filter(where status='completed')) from public.appointments where lead_id=l.id)) item from selected l)
 select jsonb_build_object('leads',(select coalesce(jsonb_agg(item),'[]') from rows),'leadTotal',(select count(*) from filtered),'pageSize',50,'leadProperties',(select coalesce(jsonb_agg(p),'[]') from(select distinct on(property_snapshot->>'id') property_snapshot->>'id' id,property_snapshot->>'title' title,property_snapshot->>'reference' reference from public.appointments where calendar_id=c.id and property_snapshot is not null order by property_snapshot->>'id' limit 2000) p)) into result;
 return result;
end $$;

create or replace function public.appointment_calendar(p_from timestamptz,p_until timestamptz)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.appointment_settings;
begin
 select * into c from public.appointment_settings where slug='thony';perform public.appointment_require(c.id);perform public.appointment_expire(c.id);
 if p_from is null or p_until is null or p_until<=p_from or p_until-p_from>interval '62 days' then raise exception 'Intervalo de calendario inválido' using errcode='22023';end if;
 return(select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'starts_at',a.starts_at,'ends_at',a.ends_at,'status',a.status,'modality',a.modality,'kind',a.kind,'buffer_minutes',a.buffer_minutes,'client',jsonb_build_object('name',l.name),
 'proposals',(select coalesce(jsonb_agg(p),'[]') from public.appointment_proposals p where appointment_id=a.id and status='pending'),'history','[]'::jsonb) order by a.starts_at),'[]')
 from public.appointments a join public.leads l on l.id=a.lead_id where a.calendar_id=c.id and a.status not in('rejected','expired','cancelled_client','cancelled_thony')
 and((a.starts_at>=p_from and a.starts_at<p_until) or exists(select 1 from public.appointment_proposals p where p.appointment_id=a.id and p.status='pending' and p.starts_at>=p_from and p.starts_at<p_until)));
end $$;
create or replace function public.appointment_detail(p_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.appointment_settings; result jsonb;
begin
 select * into c from public.appointment_settings where slug='thony';perform public.appointment_require(c.id);perform public.appointment_expire(c.id);
 select to_jsonb(a)||jsonb_build_object('client',jsonb_build_object('id',l.id,'name',l.name,'email',l.email,'phone',l.phone,'preference',l.communication_preference,'whatsappConsent',l.whatsapp_consent_at is not null),
 'proposals',(select coalesce(jsonb_agg(p order by created_at desc),'[]') from public.appointment_proposals p where appointment_id=a.id),
 'history',(select coalesce(jsonb_agg(h order by created_at),'[]') from public.appointment_history h where appointment_id=a.id)) into result from public.appointments a join public.leads l on l.id=a.lead_id where a.id=p_id and a.calendar_id=c.id;
 if result is null then raise exception 'Cita no encontrada' using errcode='P0002';end if;return result;
end $$;

create or replace function public.appointment_notification_history(p_appointment uuid default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.appointment_settings;
begin
 select * into c from public.appointment_settings where slug='thony';perform public.appointment_require(c.id,'notifications');
 if p_appointment is not null and not exists(select 1 from public.appointments where id=p_appointment and calendar_id=c.id) then raise exception 'Cita no autorizada' using errcode='42501';end if;
 return jsonb_build_object('notifications',(select coalesce(jsonb_agg(x order by created_at desc),'[]') from(select id,appointment_id,event,recipient,channel,status,attempts,scheduled_at,available_at,sent_at,delivered_at,last_error,provider_id,created_at from public.notification_jobs where calendar_id=c.id and(p_appointment is null or appointment_id=p_appointment) order by created_at desc limit 500) x),
 'notificationAttempts',(select coalesce(jsonb_agg(x order by started_at desc),'[]') from(select attempt_log.id,attempt_log.job_id,attempt_log.attempt,attempt_log.outcome,attempt_log.provider,attempt_log.provider_id,attempt_log.error_code,attempt_log.started_at,attempt_log.finished_at from public.notification_attempts attempt_log join public.notification_jobs j on j.id=attempt_log.job_id where j.calendar_id=c.id and(p_appointment is null or j.appointment_id=p_appointment) order by started_at desc limit 1000) x),
 'notificationEvents',(select coalesce(jsonb_agg(x order by occurred_at desc),'[]') from(select e.id,e.job_id,e.provider,e.status,e.occurred_at from public.notification_delivery_events e join public.notification_jobs j on j.id=e.job_id where j.calendar_id=c.id and(p_appointment is null or j.appointment_id=p_appointment) order by occurred_at desc limit 1000) x));
end $$;
create or replace function public.appointment_unblock_notifications()
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.appointment_settings;
begin
 select * into c from public.appointment_settings where slug='thony';perform public.appointment_require(c.id);perform public.appointment_require(c.id,'notifications');
 update public.notification_jobs set available_at=now() where calendar_id=c.id and status='blocked' and scheduled_at<=now();
 perform public.appointment_log(c.id,null,null,'notification_channels_rechecked');
end $$;

create or replace function public.appointment_public_availability(p_secret text,p_kind text,p_modality text default 'presencial',p_day date default null,p_month date default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform public.appointment_server_require(p_secret);
 if (p_day is null)=(p_month is null) then raise exception 'Selecciona día o mes' using errcode='22023';end if;
 if p_day is not null then return public.appointment_public_slots(p_day,p_kind,p_modality);end if;
 return public.appointment_public_month(p_month,p_kind,p_modality);
end $$;

create or replace function public.appointment_refresh_whatsapp(p_calendar uuid,p_lead uuid default null)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 insert into public.notification_jobs(calendar_id,appointment_id,event,recipient,channel,dedupe_key,payload,schedule_version,scheduled_at,valid_until)
 select j.calendar_id,j.appointment_id,j.event,j.recipient,'whatsapp',replace(j.dedupe_key,':email:',':whatsapp:'),j.payload,j.schedule_version,j.scheduled_at,j.valid_until
 from public.notification_jobs j join public.appointments a on a.id=j.appointment_id join public.leads l on l.id=a.lead_id join public.appointment_settings c on c.id=j.calendar_id
 where j.calendar_id=p_calendar and j.channel='email' and j.event like 'reminder_%' and j.scheduled_at>now() and j.status in('pending','retry','blocked')
 and((p_lead is null and j.recipient='owner' and c.owner_whatsapp_opt_in) or(p_lead is not null and a.lead_id=p_lead and j.recipient='client' and l.whatsapp_consent_at is not null)) on conflict(dedupe_key) do nothing;
 update public.notification_jobs j set status='pending',available_at=now(),last_error=null
 from public.appointments a where j.appointment_id=a.id and j.calendar_id=p_calendar and j.channel='whatsapp' and j.status='cancelled'
 and j.last_error='consent_withdrawn' and j.sent_at is null and j.scheduled_at>now()
 and((p_lead is null and j.recipient='owner') or(p_lead is not null and j.recipient='client' and a.lead_id=p_lead)) and public.appointment_job_valid(j.id);
end $$;

-- Ningún ayudante de escritura queda expuesto por el EXECUTE predeterminado de PostgreSQL.
do $$ declare fn record; begin
 for fn in select p.oid::regprocedure signature,p.proname name from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname like 'appointment\_%' escape '\' loop
  execute format('revoke all on function %s from public,anon,authenticated',fn.signature);
  if fn.name in('appointment_public_config','appointment_public_properties','appointment_public_availability','appointment_customer_availability','appointment_rate_gate','appointment_request','appointment_customer','appointment_worker_claim','appointment_worker_prepare','appointment_worker_finish','appointment_delivery','appointment_worker_cleanup') then
   execute format('grant execute on function %s to anon,authenticated',fn.signature);
  elsif fn.name in('appointment_access','appointment_permission','appointment_public_month','appointment_configure','appointment_admin_action','appointment_admin_slots','appointment_workspace','appointment_lead_action','appointment_grant_action','appointment_export','appointment_lead_detail','appointment_search_leads','appointment_calendar','appointment_detail','appointment_notification_history','appointment_unblock_notifications') then
   execute format('grant execute on function %s to authenticated',fn.signature);
  end if;
 end loop;
end $$;
notify pgrst,'reload schema';
commit;

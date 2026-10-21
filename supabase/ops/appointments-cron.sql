-- Instalación explícita del propietario. No se ejecuta desde las migraciones ni desde Next.
-- Prerrequisitos: código publicado, migraciones, bootstrap, Vault, integraciones Cron/pg_net activadas.
-- La autorización de la ruta reside en un secreto de Vault y su hash SQL; no se usa service_role.
begin;
do $$ begin
 if not exists(select 1 from pg_namespace where nspname='cron') or not exists(select 1 from pg_namespace where nspname='net') then raise exception 'Activa Supabase Cron y pg_net en el proyecto existente';end if;
 if to_regclass('vault.decrypted_secrets') is null then raise exception 'Configura Vault';end if;
 if has_table_privilege('anon','vault.decrypted_secrets','SELECT') or has_table_privilege('authenticated','vault.decrypted_secrets','SELECT') then raise exception 'Vault no puede ser legible por clientes; revisar permisos antes de programar';end if;
 if to_regclass('net.http_request_queue') is not null and(has_table_privilege('anon','net.http_request_queue','SELECT') or has_table_privilege('authenticated','net.http_request_queue','SELECT')) then raise exception 'La cola de pg_net no puede exponer cabeceras de autorización a clientes';end if;
 if not exists(select 1 from public.appointment_runtime where server_secret_hash is not null) then raise exception 'Completa primero el bootstrap';end if;
end $$;
create or replace function public.appointment_cron_tick()
returns bigint language plpgsql security definer set search_path=public,pg_temp as $$
declare secret_value text; request_id bigint;
begin
 select decrypted_secret into secret_value from vault.decrypted_secrets where name='thony_appointments_server_secret';
 perform public.appointment_server_require(secret_value);
 select net.http_post(
  url:='https://thony-ramaldi.vercel.app/api/internal/appointments/process',
  headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||secret_value),
  body:=jsonb_build_object('scheduledAt',now()),timeout_milliseconds:=55000
 ) into request_id;
 return request_id;
end $$;
revoke all on function public.appointment_cron_tick() from public,anon,authenticated;
do $$ declare job_id bigint;begin
 select cron.schedule('thony-appointments-every-minute','* * * * *','select public.appointment_cron_tick();') into job_id;
 update public.appointment_runtime set scheduler_enabled_at=now(),scheduler_job_id=job_id where id=1;
end $$;
commit;
-- Verificación de SOLO LECTURA; no contiene secretos:
select jobid,schedule,active from cron.job where jobname='thony-appointments-every-minute';
select last_worker_at,scheduler_enabled_at from public.appointment_runtime where id=1;
-- Comprobar después una ejecución y los logs de cron.job_run_details/net._http_response.
-- HTTP aceptado por pg_net no equivale a correo o WhatsApp entregado.

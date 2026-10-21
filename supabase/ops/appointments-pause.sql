-- Pausa reversible del propietario: conserva citas, clientes, permisos, archivos e historial.
begin;
update public.appointment_settings set enabled=false,revision=revision+1,updated_at=now() where slug='thony';
do $$ declare job_record record;begin
 if to_regclass('cron.job') is not null then
  for job_record in select jobid from cron.job where jobname='thony-appointments-every-minute' loop
   perform cron.unschedule(job_record.jobid);
  end loop;
 end if;
end $$;
update public.appointment_runtime set scheduler_enabled_at=null,scheduler_job_id=null where id=1;
commit;
-- La pausa de Cron detiene también recordatorios: coordinar las citas confirmadas pendientes.
-- Para reanudar: revisar providers/configuración, aplicar appointments-cron.sql y comprobar heartbeat;
-- habilitar nuevas reservas desde el panel únicamente cuando se haya validado el servicio.

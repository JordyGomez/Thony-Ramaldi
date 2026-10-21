-- Ejecutar SOLO el propietario, después del preflight y respaldo recuperable.
-- Sustituir el UID por el de la cuenta REAL de Thony ya verificada en este Supabase Auth.
-- Guardar primero en Supabase Vault un secreto aleatorio de al menos 32 bytes con nombre
-- thony_appointments_server_secret; usar exactamente ese valor en APPOINTMENTS_SERVER_SECRET de Vercel.
-- No pegar valores reales en Git, documentación ni chats.
begin;
do $$
declare target_user uuid:='00000000-0000-0000-0000-000000000000';
 c public.appointment_settings; verified_email text; server_secret text;
begin
 if current_user in('anon','authenticated') then raise exception 'Se requiere el propietario de la base';end if;
 if target_user='00000000-0000-0000-0000-000000000000'::uuid then raise exception 'Sustituye el UID vacío por la cuenta verificada y autorizada de Thony';end if;
 select email into verified_email from auth.users where id=target_user and email_confirmed_at is not null;
 if lower(coalesce(verified_email,''))<>'brokerthonypaulino@ramaldigroup.com' then raise exception 'El UID debe corresponder al correo profesional confirmado de Thony';end if;
 select * into c from public.appointment_settings where slug='thony' for update;
 if c.id is null then raise exception 'La migración de citas no está instalada';end if;
 if c.owner_user_id is not null and c.owner_user_id<>target_user then raise exception 'La agenda ya tiene otro propietario; revisa la transferencia, no reasignes sus datos automáticamente';end if;
 if to_regclass('vault.decrypted_secrets') is null then raise exception 'Configura Supabase Vault antes de continuar';end if;
 select decrypted_secret into server_secret from vault.decrypted_secrets where name='thony_appointments_server_secret';
 if server_secret is null or length(server_secret)<32 then raise exception 'Falta el secreto de servicio en Vault';end if;
 update public.appointment_settings set owner_user_id=target_user where id=c.id;
 insert into public.appointment_access_grants(calendar_id,user_id,kind,can_manage,can_read_leads,can_export,can_manage_permissions,can_view_notifications,authorized_by)
 values(c.id,target_user,'owner',true,true,true,true,true,null)
 on conflict(calendar_id,user_id) do update set kind='owner',can_manage=true,can_read_leads=true,can_export=true,can_manage_permissions=true,can_view_notifications=true,revoked_at=null,authorized_at=now();
 update public.appointment_runtime set server_secret_hash=encode(sha256(convert_to(server_secret,'UTF8')),'hex') where id=1;
 perform public.appointment_log(c.id,null,null,'owner_bootstrap',null,null,jsonb_build_object('authorizedUserId',target_user,'databaseRole',current_user),'database_owner');
end $$;
commit;
-- No se habilitan horarios ni reservas aquí. Nadie recibe SUPERADMIN global.
-- Los técnicos ya verificados como SUPERADMIN se autorizan después, por UID, desde la configuración de agenda.

-- OPERACIÓN MANUAL DEL PROPIETARIO. No se llama desde la aplicación.
-- Sustituir el UID de ejemplo por una cuenta real, verificada y autorizada.
-- No usar un email deducido de la conversación ni concederlo a todos los admins.
begin;
do $$
declare target_uid uuid := '00000000-0000-0000-0000-000000000000';
begin
  if not exists(select 1 from auth.users where id=target_uid and email_confirmed_at is not null) then
    raise exception 'Selecciona y verifica el UID autorizado antes de ejecutar este bootstrap';
  end if;
  insert into public.platform_superadmins(user_id) values(target_uid) on conflict do nothing;
end $$;
commit;

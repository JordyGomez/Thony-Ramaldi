-- SOLO LECTURA. Ejecutar como propietario antes de instalar la agenda.
select current_user as database_role,current_database() as database_name;
select table_name from information_schema.tables where table_schema='public'
 and table_name in('properties','admin_users','platform_state','platform_superadmins','appointment_settings','appointment_access_grants','appointments','leads','notification_jobs') order by table_name;
select table_name,column_name,data_type,is_nullable from information_schema.columns where table_schema='public'
 and(table_name like 'appointment_%' or table_name in('leads','lead_notes','lead_tasks','notification_jobs','notification_attempts','notification_delivery_events')) order by table_name,ordinal_position;
select schemaname,tablename,policyname,roles,cmd,qual,with_check from pg_policies where schemaname in('public','storage') order by tablename,policyname;
select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) as arguments,p.prosecdef as security_definer,p.proconfig
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where(n.nspname='public' and(p.proname like 'appointment_%' or p.proname in('is_platform_superadmin','public_platform_snapshot','is_admin')))
 or(n.nspname in('net','cron') and p.proname in('http_post','schedule','unschedule')) order by n.nspname,p.proname;
select conname,conrelid::regclass,pg_get_constraintdef(oid) from pg_constraint where connamespace='public'::regnamespace order by conrelid,conname;
select event_object_table,trigger_name,action_statement from information_schema.triggers where trigger_schema='public' order by event_object_table,trigger_name;
select name,default_version,installed_version from pg_available_extensions where name in('btree_gist','pg_cron','pg_net','supabase_vault');
-- No consultar secretos de Vault, hashes de servicio ni datos de clientes para este inventario.
-- Comparar cualquier tabla que ya exista: no adoptar tablas de otro módulo solo por su nombre.

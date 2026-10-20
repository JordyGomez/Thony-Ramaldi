-- SOLO LECTURA. Ejecutar como propietario antes de revisar la ampliación.
select schemaname,tablename,rowsecurity from pg_tables
where schemaname in ('public','auth','storage') order by schemaname,tablename;
select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
from pg_policies where schemaname in ('public','storage') order by schemaname,tablename,policyname;
select n.nspname,p.proname,p.prosecdef,pg_get_function_identity_arguments(p.oid),pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in ('is_admin','touch_updated_at','save_site_content','platform_access','change_site_mode','public_platform_snapshot','before_platform_user_created');
select c.relname,t.tgname,pg_get_triggerdef(t.oid) from pg_trigger t join pg_class c on c.oid=t.tgrelid
where not t.tgisinternal and c.relnamespace='public'::regnamespace;
select conrelid::regclass,conname,pg_get_constraintdef(oid) from pg_constraint
where connamespace='public'::regnamespace order by conrelid::regclass::text,conname;
select table_name,grantee,privilege_type from information_schema.role_table_grants
where table_schema='public' order by table_name,grantee,privilege_type;
select id,name,public,file_size_limit,allowed_mime_types from storage.buckets;
select count(*) as existing_properties from public.properties;
select rolname from pg_roles where rolname in ('anon','authenticated','supabase_auth_admin');
-- Comparar con el repositorio; no pegar datos sensibles o definiciones privadas
-- en un PR. Respaldo de datos y de Storage por separado antes de instalar.

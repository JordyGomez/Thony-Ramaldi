# Instalación, aprobación, activación y reversión

## Estado de esta entrega

Código en `feat/private-dual-mode-platform`, PR #12. Main y la web publicada permanecen en Thony. No se ejecutó SQL ni se crearon cuentas o inmuebles en Supabase real. La consulta anónima confirmó `properties` disponible y ausencia de `site_content`, `organizations` y `platform_state` (PGRST205). No hubo acceso a una introspección privilegiada del esquema real.

El usuario ya indicó que no tiene acceso a Supabase. Estas tareas corresponden al propietario de ese proyecto, sin compartir contraseñas o claves en el chat. No sustituir esa intervención con un superadministrador simulado, una clave privilegiada en Vercel ni permisos derivados de `admin_users`.

## Instalación revisada en la base existente

1. Revisar PR #11 de Claude y el diff completo de #12. No integrar una versión parcial. Repetir fetch y comprobar conflictos/CI antes de integrar código.
2. El propietario ejecuta las consultas de [preflight](../supabase/ops/platform-preflight.sql) y compara tablas, restricciones, funciones, triggers, RLS, permisos y buckets reales con las versiones del repositorio. Una consulta pública no sustituye esa inspección.
3. Obtener un respaldo recuperable del esquema y los datos actuales, incluidos Auth, administradores, CMS/revisiones y propiedades; conservar manifiesto y copia de los archivos de Storage. Probar su restauración en un entorno aislado. No basta con conservar URLs de fotos.
4. Si falta, aplicar primero `20261018_site_editor.sql`. No volver a ejecutar `schema.sql` indiscriminadamente: el proyecto actual ya existe y ese archivo contiene instrucciones iniciales/ejemplo de administrador.
5. Aplicar [20261020_dual_mode_platform.sql](../supabase/migrations/20261020_dual_mode_platform.sql) después de la revisión. Es transaccional y repetible; mantiene Thony y no concede SUPERADMIN. Las propiedades actuales siguen sin organización/asesor empresarial y conservan su visibilidad personal. Si un bucket público ajeno ya usa `platform-media`, la migración aborta para revisar la colisión.
6. El propietario verifica el UID y correo confirmado de la persona autorizada y usa el [bootstrap explícito](../supabase/ops/bootstrap-platform-superadmin.sql). El UID de ejemplo no concede nada. Si una cuenta necesita también administrar el contenido personal, conservar/asignar ese permiso por separado en `admin_users`.
7. Comprobar con cuentas reales autorizadas que el administrador personal conserva su panel, una cuenta común no ve el apartado avanzado y únicamente SUPERADMIN abre `/admin/plataforma` y su vista previa.

La migración crea `organizations`, `platform_superadmins`, `platform_state`, `organization_members`, `membership_invitations`, `agent_profiles`, `site_mode_settings`, `site_mode_revisions`, `publication_approvals`, `property_documents`, `platform_audit` y `mode_change_audit`. Amplía `properties` con procedencia, responsable, workflow, visibilidad por modo y versión. El CMS personal conserva sus tablas y RPC actuales; no se copian sus contactos al empresarial.

## Antes de habilitar incorporación

Configuración única en el Supabase existente, revisada por su propietario:

- Activar confirmación de correo, alinear el mínimo de contraseña con los 12 caracteres de la aplicación y configurar entrega SMTP, recuperación y las URLs permitidas de `/auth/confirm` en el dominio actual. Añadir solo previews propias que realmente se vayan a utilizar.
- Registrar `public.before_platform_user_created` como **Before User Created** en Supabase Auth. La migración prepara la función y el permiso de `supabase_auth_admin`; no puede configurar el dashboard de Auth por sí sola. Ver [contrato oficial del hook](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook).
- Configurar CAPTCHA Turnstile en Supabase Auth y su clave pública `NEXT_PUBLIC_AUTH_CAPTCHA_SITE_KEY` en la aplicación. El secreto del proveedor se configura en Supabase, nunca en código cliente. Verificar límites de Auth y correo. Sin clave pública/verificación, la ruta de altas no permite continuar.
- Comprobar que una llamada directa a Auth sin invitación falla, que una invitación revocada/vencida no sirve, que el email debe verificarse y que una cuenta nueva no obtiene membresía automáticamente.
- Solo entonces habilitar nuevas altas del proveedor y permitir incorporación con invitación desde la autorización administrativa. En modo Thony las altas empresariales siguen cerradas, también en el hook.

Las cuentas existentes no se borran ni pasan por el hook de creación. El restablecimiento usa Supabase Auth, un destino local permitido y cierre de sesión después del cambio. No se crea otro sistema de contraseñas.

## Preparar la identidad corporativa

La empresa debe aprobar expresamente el uso del nombre y logo como portal corporativo, los recursos de portada, textos, servicios, contactos y SEO, el responsable de administrar empleados y el procedimiento de revisión/publicación. La autorización del portafolio de Thony no cubre este uso.

El administrador prepara contenido en Administración empresarial o en el editor existente `/admin/web?mode=ramaldi`. El parámetro selecciona un ámbito privado autorizado; no selecciona la identidad pública ni elude permisos. Los textos de navegación se configuran por separado y las rutas admitidas permanecen controladas. Nombre conocido y colores de la interfaz sirven para la maqueta privada, sin afirmar que sean una norma corporativa certificada. Teléfono, correo, dirección, historia y servicios desconocidos quedan vacíos. La publicación de configuración exige portada, logo y contacto empresarial; **publicar configuración no cambia el modo**.

La vista `/admin/plataforma/vista-previa` comprueba SUPERADMIN en servidor, contiene marcos PC/móvil y navega a perfiles/inmuebles aprobados mediante rutas privadas que repiten la autorización. Utiliza el borrador corporativo y únicamente perfiles/inventario autorizados; si no existen, muestra estados vacíos. No hay empleados o anuncios de relleno. No está en el sitemap y hereda noindex de administración.

Para preparar inventario antes de activar, puede trabajar una cuenta empresarial administradora verificada y autorizada explícitamente. Los asesores comunes no obtienen herramientas mientras Ramaldi está desactivado. No crear cuentas de prueba para preparar producción.

## Activación explícita sin redeploy

Solo después de autorización corporativa real y configuración publicada lista:

1. SUPERADMIN abre Configuración avanzada → Modo de operación y selecciona Ramaldi.
2. Revisa modo actual/nuevo, conteos de propiedades visibles, directorio/contactos que pasarán a mostrarse y efectos en SEO/navegación.
3. Confirma escribiendo `CAMBIAR A RAMALDI`. El servidor y la RPC comprueban sesión, permiso, aprobación, configuración y revisión esperada.
4. Una transacción bloquea el estado y configura el modo; registra autor, fecha, revisión, conteo y referencia de aprobación. Si otro operador cambió el estado, rechaza con conflicto y no sobrescribe.
5. Next invalida rutas y tags, incluidos metadatos, sitemap, robots y Open Graph. Cada nueva petición obtiene un snapshot coherente de modo/contenido/inventario. El modo no usa caché compartida; los layouts retenidos no pintan una página de la otra identidad. Las pestañas abiertas comprueban cambios al recuperar visibilidad y cada 30 segundos mientras están visibles; una pestaña desconectada se actualiza al recuperar conexión.

No se crea un dominio nuevo. Cambiar identidad no cambia el despliegue ni los datos almacenados. Los navegadores y buscadores externos pueden conservar imágenes/documentos que ya descargaron; la actualización del servidor no equivale a vaciar sus cachés.

## Reversión segura

Seleccionar Thony, revisar el impacto y escribir `CAMBIAR A THONY`. La reversión siempre está disponible a SUPERADMIN con sesión verificada, aunque la configuración corporativa esté incompleta. Usa el mismo control de revisión/auditoría y revalidación. Recupera contenido, navegación, fotografía, contactos y catálogo personal; perfiles, propiedades, documentos, revisiones y permisos empresariales se conservan. Su visibilidad adicional en Thony solo existe si SUPERADMIN la autorizó expresamente.

La reversión operativa es cambiar el modo, no borrar tablas ni ejecutar migraciones inversas destructivas. Ante una migración fallida, PostgreSQL revierte la transacción; revisar la causa antes de reintentar. Ante una incidencia posterior, pasar a Thony y corregir mediante otra migración aditiva revisada. Restaurar un respaldo solo mediante un procedimiento del propietario que tenga en cuenta los cambios posteriores al respaldo.

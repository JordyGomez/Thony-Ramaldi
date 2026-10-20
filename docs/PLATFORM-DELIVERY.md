# Informe de entrega — plataforma Thony / Ramaldi

## Estado de integración

PR #12 listo para revisión, rama `feat/private-dual-mode-platform`. La entrega prepara código y migraciones; no integra main, no despliega producción y no activa Ramaldi. El primer hito SQL se publicó en `4612a88` y la implementación completa en `ca0cd1c`. La comprobación final de pruebas y GitHub se registra en HANDOFF y los checks del último commit.

## Funcionalidades implementadas

Una aplicación Next.js y un Supabase/Auth con dos identidades reversibles. Thony conserva composición, portada, retrato, contactos, inventario y panel; Ramaldi tiene configuración/editor/historial independientes, navegación propia, catálogo con responsable aprobado y directorio de perfiles públicos activos. No se crean empleados ni ofertas de relleno.

`/admin/web` conserva el editor personal y permite el ámbito empresarial solo a sus revisores. `/admin/empresa` amplía el panel con solicitudes, invitaciones revocables, perfiles, inmuebles propios, observaciones, documentos privados y planos tras aprobación. El formulario y las subidas existentes se reutilizan. `/admin/plataforma` y su preview PC/móvil exigen SUPERADMIN en servidor y base de datos, sin control activable por un usuario común.

## Claude: cambios detectados y preservados

Se revisaron todas las ramas obtenidas, GitHub, PR abiertos y documentación antes de editar. Main era `d427708`; el PR #11 de Claude/Yordi Lewis incluye `2a51427` y el merge `3b1931f`, que retiran los textos secundarios del hero y sus campos. Esta rama parte de `3b1931f`. La atribución está confirmada por los commits y la descripción, no inferida únicamente de un autor.

El diff respecto de ese antecedente conserva sin cambios `hero.tsx`, `site-fields.ts`, `site-settings.ts`, `globals.css`, `cinematic.css`, Header/Footer/HomeContent, activos, esquema base y lockfile. Las ampliaciones del panel se integran sobre sus formularios y Auth. Se mantienen las entradas documentales anteriores de ambos colaboradores. No se puede revisar trabajo privado que no esté publicado en GitHub.

## Esquema preparado

`20261020_dual_mode_platform.sql`, después de `20261018_site_editor.sql`. Crea `organizations`, `platform_superadmins`, `platform_state`, `organization_members`, `membership_invitations`, `agent_profiles`, `site_mode_settings`, `site_mode_revisions`, `publication_approvals`, `property_documents`, `platform_audit` y `mode_change_audit`. Amplía `properties` con organización, responsable, workflow, visibilidad por modalidad y versión.

Migración aditiva/transaccional, repetible y probada aislada; no asigna automáticamente inventario existente a una organización, no concede SUPERADMIN ni borra archivos. El bucket legado se conserva; el empresarial es privado y queda protegido también frente a políticas permisivas antiguas adicionales. Las tablas de publicación/borradores/revisiones personales no se sustituyen.

Las lecturas reales disponibles fueron anónimas. No hubo inspección privilegiada completa ni ejecución de DDL, altas, archivos o publicaciones en Supabase real. Preflight, respaldo y bootstrap manual están preparados para el propietario; el usuario ya informó que no dispone de ese acceso.

## Permisos, empleados y publicaciones

SUPERADMIN por UID verificado controla la identidad y autorizaciones. El administrador empresarial revisa solicitudes y contenido; el asesor activo gestiona sus propios registros; la cuenta pendiente solo consulta/completa su solicitud. `admin_users` sigue siendo administración personal, sin promoción implícita. Los permisos se verifican en servidor y otra vez en RPC/RLS.

Incorporación: invitación → registro controlado/CAPTCHA en Supabase Auth → correo verificado → solicitud pendiente → revisión de pertenencia. El hook preparado también rechaza altas directas sin invitación; un dominio corporativo o metadatos de perfil no conceden roles. No se envían invitaciones por canales externos desde esta tarea.

Propiedad: borrador propio → pendiente → aprobado → publicado, con correcciones/rechazo/oculto/vendido/alquilado y versiones. Editar una publicación o sus documentos exige nueva revisión. Los perfiles se aprueban por separado y conservan su versión pública anterior al editar; una ocultación administrativa no puede eludirse guardando un borrador. Los documentos privados quedan fuera del snapshot y solo los planos expresamente autorizados aparecen tras publicar la ficha.

## Separación, cambio y reversión

El modo activo, contenido, perfiles y catálogo se leen coherentemente en un snapshot por petición. Configuraciones y borradores de una identidad no sobrescriben la otra. Las propiedades se relacionan por visibilidad, sin duplicación física; las anteriores conservan su procedencia personal. Las previews consultan el catálogo de su propia modalidad.

SUPERADMIN ve modo actual/nuevo, conteos antes/después y número de propiedades cuya visibilidad cambia, efectos en SEO/navegación y confirmación explícita. Ramaldi requiere autorización corporativa y configuración publicada lista. La operación bloquea el estado, comprueba revisión y registra autor/fecha/identidades; invalida rutas/tags y metadatos. No requiere redeploy para cada cambio. Los layouts no pintan otra identidad y las pestañas verifican cambios al recuperar visibilidad o cada 30 segundos visibles.

Para volver: seleccionar Thony y escribir `CAMBIAR A THONY`, revisar el impacto y confirmar. Recupera configuración/contactos/catálogo personal sin borrar empleados, propiedades, medios, borradores ni permisos. El panel de reversión no depende de que el contenido editorial público sea válido.

El renderizado dinámico requiere respuesta válida de Supabase; no promete el respaldo HTML de la versión ISR anterior durante una interrupción ni presenta otra identidad como reserva. Se conserva el dominio actual.

## Verificaciones

En `ca0cd1c`, [CI 39443472356](https://github.com/JordyGomez/Thony-Ramaldi/actions/runs/39443472356) aprobó lint, tipos, builds y las **160 comprobaciones**: 84 regresiones, 8 públicas, 13 del panel anterior, 17 empresariales y 38 SQL, sin fallos ni omitidas. Vercel Preview compiló correctamente y exige SSO para abrirse desde fuera; no se eludió. El arranque normal con la configuración actual también pasó las comprobaciones de Thony, login, registro desactivado y rechazo de API privada. Los checks del último SHA incluyen las actualizaciones documentales posteriores; revisarlos antes de integrar. Las pruebas usan datos ficticios solo en loopback. Auth/Storage se simulan; SQL, constraints, triggers y RLS se ejecutan con PostgreSQL real embebido. No se afirma haber verificado SMTP/CAPTCHA gestionados, cuentas reales, Safari o teléfonos físicos.

## Preparado pero desactivado

No se instala el esquema real, no se concede SUPERADMIN a nadie y no se habilitan altas o identidad corporativa en producción. La preview empresarial real necesita la instalación/rol verificados. Para activar, la empresa debe aprobar identidad oficial, logo/portada, textos/servicios, contactos/SEO y responsables de revisión; la aprobación del portafolio personal de Thony no sustituye esa autorización.

El propietario configura migraciones, cuenta técnica verificada, hook Before User Created, confirmación de correo, contraseñas, SMTP/recuperación, CAPTCHA y límites de Auth. Luego se revisa la preview privada y solo una confirmación de SUPERADMIN cambia el modo. Procedimiento completo en PLATFORM-OPERATIONS; permisos y seguridad en sus documentos específicos.

## Archivos de esta ampliación

Inventario respecto del antecedente de Claude del PR #11; no atribuye a esta ampliación los cambios que ya estaban en ese PR.

- `.env.example`
- `.github/workflows/ci.yml`
- `AGENTS.md`
- `CLAUDE.md`
- `README.md`
- `docs/CHANGELOG.md`
- `docs/HANDOFF.md`
- `docs/PLATFORM-ARCHITECTURE.md`
- `docs/PLATFORM-DELIVERY.md`
- `docs/PLATFORM-OPERATIONS.md`
- `docs/PLATFORM-PERMISSIONS.md`
- `docs/PLATFORM-SECURITY.md`
- `docs/PLATFORM-TESTING.md`
- `docs/PULL_REQUEST.md`
- `docs/ROADMAP.md`
- `package.json`
- `playwright.platform.config.ts`
- `scripts/test-platform.mjs`
- `src/app/(site)/asesores/[slug]/page.tsx`
- `src/app/(site)/asesores/page.tsx`
- `src/app/(site)/layout.tsx`
- `src/app/(site)/page.tsx`
- `src/app/(site)/propiedades/[slug]/page.tsx`
- `src/app/admin/[id]/page.tsx`
- `src/app/admin/account-form.tsx`
- `src/app/admin/actions.ts`
- `src/app/admin/admin-bar.tsx`
- `src/app/admin/corporate-site-editor.tsx`
- `src/app/admin/cuenta/page.tsx`
- `src/app/admin/empresa/nueva/page.tsx`
- `src/app/admin/empresa/page.tsx`
- `src/app/admin/empresa/propiedades/[id]/page.tsx`
- `src/app/admin/empresa/workspace.tsx`
- `src/app/admin/login/login-form.tsx`
- `src/app/admin/media-uploader.tsx`
- `src/app/admin/nueva/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/plataforma/page.tsx`
- `src/app/admin/plataforma/settings.tsx`
- `src/app/admin/plataforma/vista-previa/contenido/[[...route]]/page.tsx`
- `src/app/admin/plataforma/vista-previa/page.tsx`
- `src/app/admin/plataforma/vista-previa/screen.tsx`
- `src/app/admin/property-form.tsx`
- `src/app/admin/property-input.ts`
- `src/app/admin/recuperar/page.tsx`
- `src/app/admin/registro/page.tsx`
- `src/app/admin/vista-previa/page.tsx`
- `src/app/admin/web/page.tsx`
- `src/app/api/admin/media/route.ts`
- `src/app/api/admin/platform/route.ts`
- `src/app/api/platform/account/route.ts`
- `src/app/api/platform/identity/route.ts`
- `src/app/api/platform/media/[...path]/route.ts`
- `src/app/auth/confirm/route.ts`
- `src/app/opengraph-image.tsx`
- `src/app/robots.ts`
- `src/app/sitemap.ts`
- `src/components/corporate-portal.module.css`
- `src/components/corporate-portal.tsx`
- `src/components/gallery.tsx`
- `src/components/public-mode.tsx`
- `src/data/get-platform-identity.ts`
- `src/data/get-platform.ts`
- `src/data/get-properties.ts`
- `src/data/get-site-settings.ts`
- `src/data/get-thony-preview-properties.ts`
- `src/data/property-row.ts`
- `src/lib/media-upload.ts`
- `src/lib/platform-access.ts`
- `src/lib/platform-editor.ts`
- `src/lib/platform.ts`
- `src/lib/supabase/env.ts`
- `src/proxy.ts`
- `supabase/migrations/20261020_dual_mode_platform.sql`
- `supabase/ops/bootstrap-platform-superadmin.sql`
- `supabase/ops/platform-preflight.sql`
- `tests-admin/supabase-server.mjs`
- `tests-db/platform.test.mjs`
- `tests-platform/platform.spec.ts`
- `tests-platform/supabase-server.mjs`

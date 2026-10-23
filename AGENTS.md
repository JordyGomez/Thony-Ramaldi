# Reglas de colaboración — Thony Ramaldi

## Dirección vigente — TREO II, 2026-10-23

El usuario autoriza una presentación con profundidad 3D **solo para la primera ficha TREO II**. No reactivar animaciones globales retiradas ni alterar portada/menú de Claude. Usar los renders originales facilitados; los isométricos son imágenes del proyecto, no un modelo/tour 3D ni prueba de obra terminada. Respetar movimiento reducido y mantener controles explícitos.

Santiago/venta/USD confirmados por el usuario; sector desconocido. Guardar la ficha por Auth/Storage/RLS existentes, nunca habilitar fixtures, publicar un fallback estático o debilitar permisos para crearla. Preparación y preview en `/admin/proyectos/treo-ii`, sin SQL nuevo ni sobrescritura si ya existe. Unidades/precios públicos salen de Supabase y se editan desde el panel; conservar centavos y baños fraccionarios. Ver `docs/TREO-II.md`.

PR #14 de Claude/Yordi Lewis (`137a0c0`, integrado en `3b71148`) documenta migraciones ya instaladas y acceso del otro colaborador al SQL Editor. Es el estado vigente; no repetir como actual la instalación pendiente de las entregas anteriores ni atribuir a esta tarea las operaciones que hizo él.


## Dirección vigente — agenda y CRM privados, 2026-10-21

El módulo de citas se añade sobre main `cb4e376` (PR #11 y #12 ya integrados). Revisar commits/diffs/PR de Claude antes de cada integración; no reconstruir portada, menú, editor ni doble identidad. Mantener presentación estática. La petición actual permite desarrollar reservas/CRM, no activar Ramaldi ni compartir los clientes de Thony.

- La autorización de agenda es independiente: UID verificado + `appointment_access_grants`; técnicos requieren SUPERADMIN vigente además de concesión. `admin_users`, membresías y correo solos no dan acceso. Separar CRM/exportación/avisos/permisos, comprobando servidor y RLS.
- No sustituir Supabase Auth ni usar `service_role`. RPC backend con secreto privado y hash SQL; firma de enlaces con otro secreto. Enlaces del cliente limitados a su cita, caducables, revocables, nunca credenciales administrativas.
- Toda asignación/reprogramación debe pasar por transacción y exclusión GiST `[inicio, fin + margen)`; no sustituir por comparaciones de strings o bloqueo frontend. Conservar el original confirmado mientras exista una propuesta pendiente. Instantes UTC, presentación America/Santo_Domingo.
- No crear horarios, clientes, propiedades o mensajes de ejemplo en producción. Migración y scripts operativos se entregan preparados; la instalación/UID/Vault/Cron requieren al propietario. El usuario ya indicó que no tiene acceso a Supabase: no pedirlo otra vez ni solicitar secretos por chat.
- Meta oficial/Resend con verificación real. Cola persistente: guardado, aceptado y entregado son estados distintos. No reintentar un resultado Meta incierto a ciegas; invalidar avisos cancelados/obsoletos y comprobar consentimiento justo antes del envío.
- Preview bloquea reservas, mutaciones/exportación y envíos reales. Los dobles de `tests-appointments` solo funcionan en loopback fuera de Vercel. `test:appointments` compila y se ejecuta secuencialmente con los otros builds.
- Mantener búsqueda de clientes por POST, PII fuera de URLs/logs, notas privadas, exportación auditada y consentimiento WhatsApp separado. Leer los documentos `APPOINTMENTS-*` antes de modificar este módulo.

La integración de código se revisa mediante PR, checks y Preview; no implica ejecutar SQL, conceder permisos, activar proveedores ni abrir reservas. Conservar el modo público Thony.


## Dirección vigente — ampliación empresarial privada

La tarea del 2026-10-20 prepara modalidades `thony`/`ramaldi` en una sola aplicación y Supabase. **No fusionar ni cambiar producción automáticamente en esta tarea.** Mantener Thony activo, sin altas empresariales ni anuncio corporativo. Activación exige autorización verificable, configuración publicada lista y confirmación explícita de SUPERADMIN; ver `docs/PLATFORM-OPERATIONS.md`.

- Base revisada: PR #11 de Claude/Yordi Lewis (`3b1931f`), portada de fotografía y título sin sus campos retirados. La rama `feat/private-dual-mode-platform` conserva ese trabajo; coordinar su integración con #11 sin reescribirlo.
- `admin_users` conserva el panel personal. SUPERADMIN se asigna a un UID verificado por el propietario de la base, nunca automáticamente a los admins actuales ni por dominio de correo. Autorizar en servidor y otra vez en RPC/RLS.
- Propiedades legadas no se atribuyen a Ramaldi. Nuevas fichas empresariales tienen responsable y workflow; no publicar por un booleano recibido del navegador, editar estados aprobados directamente o duplicar fichas por modalidad.
- El editor `/admin/web` mantiene la identidad personal y ofrece el ámbito Ramaldi solo a revisores empresariales. Las previews consultan su propio catálogo, no el público del modo activo.
- Configuración corporativa, borradores e historial separados del CMS personal. No usar contactos, retrato ni contenido de Thony como reserva empresarial.
- Leer identidad/contenido/inventario en un snapshot por petición. `connection()` queda fuera del SDK, que captura señales de Next; no llamar ese flujo desde `generateStaticParams`. No usar caché compartida del modo, ni mostrar una configuración de reserva personal cuando un esquema empresarial instalado está incompleto.
- Mantener la protección del App Router frente a layouts de otra identidad, revalidación de rutas/SEO y sincronización de pestañas. La preview comprueba SUPERADMIN en cada ruta privada, sin parámetros públicos que eludan permisos.
- Nuevos medios en `platform-media` privado, por organización/UID y sin sobrescritura/borrado de agentes. Conservar bucket y archivos legados. Documentos privados fuera del snapshot; planos públicos requieren aprobación de la ficha.
- Antes de habilitar altas, el propietario conecta el hook `before_platform_user_created`, correo verificado, CAPTCHA y límites de Supabase Auth. Una cuenta/invitación no concede empleo ni rol; la incorporación requiere otra aprobación.
- Las migraciones siguen preparadas para revisión, no ejecutadas en producción. No simular instalación/guardado ni conceder permisos en código para evitar esa intervención. SQL real/RLS se comprueban con PGlite de desarrollo y `test:platform` usa únicamente loopback; nunca activar sus flags en Vercel. Las suites que compilan comparten `.next` y son secuenciales.

## Un producto compartido

Yordi Gómez trabaja con Codex y Yordi Lewis con Claude. Ambos pueden modificar cualquier archivo. No existen carpetas, propietarios permanentes ni responsabilidades exclusivas por asistente. Git es la fuente de verdad; la documentación explica el contexto.

## Al iniciar cada tarea o retomar una interrupción

1. Leer `README.md`, este archivo, `CLAUDE.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md` y `docs/ROADMAP.md`.
2. Confirmar que el checkout corresponde a `github.com/JordyGomez/Thony-Ramaldi`. No imprimir credenciales de remotos.
3. Revisar `git status --short`, diferencias locales y staged, ramas y commits.
4. Ejecutar `git fetch origin --prune`, comparar `HEAD` con `origin/main` y revisar commits remotos nuevos, autores, diffs y documentos de transferencia.
5. No atribuir un cambio a un asistente a partir de un nombre de autor: registrar la atribución solo cuando esté confirmada.
6. Integrar funcionalidad válida sin sobrescribir cambios locales desconocidos. Si el remoto no puede consultarse, indicarlo; no afirmar sincronización.

Repetir la revisión remota después de una tarea significativa y antes del commit, de publicar una rama o de proponer integración. No integrar cambios sobre un directorio con modificaciones sin proteger. Los cambios privados no publicados de otros colaboradores no son visibles.

## Implementación

- La petición vigente sustituye el movimiento expresivo por una presentación estática. No montar Preloader ni MotionDirector, no añadir giros, paralaje, zoom, entradas escalonadas o desplazamiento automático suave. `defaultSettings`, `parseSiteSettings` y SiteProvider fijan motion=off y entry=false, también para configuraciones/historial antiguos. El panel muestra Marca y presentación, sin controles para reactivar efectos. Mantener menú, filtros, carrusel y galería con respuesta inmediata. Los archivos de animación anteriores son legado sin montar.

- El menú completo es hermano de `.site-header`, nunca su descendiente: las transformaciones 3D y el backdrop-filter de la cabecera capturan los hijos fixed y recortan el panel. Mantener el panel anclado al viewport, sin anchura fija de escritorio; el respaldo sin JS usa CSS `@media (scripting: none)`, nunca un `<style>` dentro del `<noscript>` cliente. El propietario retiró el botón y la acción de importar Alberobello; las propiedades se crean manualmente.

- La instrucción vigente conserva la composición de Claude (main `0742704`): portada `portada.jpg`, carbón/Inter, firma y contactos. El propietario retiró después la foto ilustrativa `villa.jpg` del pie: no mostrar una imagen ni reservar su espacio hasta que haya una propiedad pública no demo con fotografías, excluyendo renders. La foto del pie se obtiene de ese inventario; no reactivar el recurso fijo aunque aparezca en configuraciones antiguas. La portada conserva la fotografía de Claude y su alt descriptivo; el PR #11 retiró los textos secundarios superpuestos. No reintroducirlos ni sustituir la foto por retrato o geometría.
- Configuración pública: `getSiteSettings()` lee solo `site_content`. Los valores de reserva y su validación están en `src/lib/site-settings.ts`; los componentes cliente usan `useSite()`. Nunca publicar borradores o historial en un endpoint anónimo. Los cambios del panel pasan por la RPC transaccional `save_site_content` con revisión esperada; mantener privados `site_drafts` y `site_revisions`.
- Las fotos del panel se suben por `/api/admin/media`, comprobando sesión real, rol, origen, tamaño y firma del archivo. No volver al catch genérico que llama conexión a todos los errores. No usar claves privilegiadas ni permitir IP privadas del optimizador en producción. Los archivos `media/` son compartidos: borrar una ficha no debe borrarlos del almacén.
- `npm run test:database` comprueba el SQL con PostgreSQL embebido. `npm run test:admin` compila y ejecuta Auth/Storage/CMS contra un doble HTTP local, sin usar Supabase real; reemplaza `.next`. Nunca habilitar sus flags en Vercel. Recompilar para el modo correspondiente antes de otras suites.

- Next.js App Router, TypeScript estricto, componentes con nombres descriptivos y separación entre datos, configuración y UI.
- Usar los componentes de servidor por defecto; `use client` solo para interacción.
- Contacto centralizado en `src/lib/site.ts`. Las páginas obtienen los inmuebles con `getProperties()` (`src/data/get-properties.ts`): solo fichas publicadas y no marcadas como demostración en Supabase (panel propio en `/admin`). Sin Supabase, el catálogo queda vacío. `sampleProperties` son fixtures explícitas (`THONY_TEST_FIXTURES=1` al compilar y ejecutar, sin `VERCEL_ENV`); nunca habilitarlas en Vercel ni crear anuncios ficticios. Mantener alineados `Property`, `supabase/schema.sql`, `src/data/property-row.ts` y `src/app/admin/property-input.ts`. Nunca usar la clave `service_role` en el proyecto.
- Mantener la dirección visual minimalista oscura (carbón, Inter fina, fotografía protagonista; ver `docs/ASSETS.md`), adaptación móvil, semántica y foco visible. Ningún texto por debajo de 12 px.
- Respetar `prefers-reduced-motion`. El contenido debe permanecer disponible si falla una animación o JavaScript.
- Cada propiedad ficticia debe mostrar “Demostración”, también en su ficha y en el mensaje de WhatsApp. No inventar anuncios reales, biografía, logros, estadísticas, testimonios, mapas ni recorridos.
- No crear una marca ficticia para reemplazar los logotipos faltantes. Ver `public/brand/README.md` y `docs/ASSETS.md`.
- No añadir backend propio, base de datos, autenticación, pagos ni motor de IA sin una tarea que lo autorice. El panel de propiedades usa Supabase (base de datos, archivos e inicio de sesión), autorizado por Yordi Lewis el 2026-10-18; la seguridad depende de las políticas de `supabase/schema.sql`.
- Mantener compatibilidad con Vercel y `next/image`. No desplegar automáticamente en producción.
- No guardar tokens, contraseñas o claves en archivos, logs o commits. `.env.local` queda ignorado.

## Validación y cierre

Ejecutar `npm ci`, `npm run lint`, `npm run typecheck`, `npm run build` y `npm test` cuando correspondan al cambio. Las pruebas de navegador requieren Chromium; ver README. Registrar lo que realmente se ejecutó, sus resultados y limitaciones. No afirmar que Core Web Vitals, Safari, dispositivos físicos o enlaces externos se verificaron si no se midieron.

Actualizar README si cambia la arquitectura o ejecución, añadir una entrada real a CHANGELOG, renovar HANDOFF y mantener los estados de ROADMAP. Conservar las entradas de ambos asistentes. Indicar colaborador, asistente confirmado, archivos, pruebas y commit real si ya existe.

Crear commits descriptivos solo con cambios intencionales. Publicar ramas con autorización y acceso; preparar PR cuando corresponda, sin fusionarlo automáticamente. Nunca ejecutar `git reset --hard`, `git clean -fd`, `git push --force`, reescribir historial compartido, eliminar trabajo ajeno o descartar modificaciones desconocidas sin autorización explícita.

Cada tarea de nube ya está aislada. Usar el checkout existente; no crear worktrees salvo solicitud expresa.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

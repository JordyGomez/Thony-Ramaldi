# Entrega — citas, agenda y CRM privados

Fecha: 2026-10-21. Colaborador: Yordi Gómez con Codex. [PR #13](https://github.com/JordyGomez/Thony-Ramaldi/pull/13). Rama: `feat/thony-appointments-private-crm`. Base: main `cb4e376`.

## Qué se implementó

- `/citas`: seis pasos, catálogo personal verificado, calendario/horarios consultados a PostgreSQL, datos mínimos, consentimiento separado y resumen. La recepción siempre indica pendiente; el identificador no es secuencial.
- Seguimiento personal con enlace firmado/caducable y cookie HttpOnly: estado, cancelación según política, propuestas, aceptación/rechazo, preferencias WhatsApp e ICS únicamente si está confirmada.
- `/admin/citas`: métricas reales, día/semana/mes/lista, bloqueos privados, intervalos libres, ficha, historial y acciones autorizadas. Confirmación/rechazo manuales y propuestas que preservan el original.
- `/admin/citas/configuracion`: días/jornadas/excepciones, bloqueos particulares y semanales, duraciones/márgenes, anticipación/horizonte/capacidad, modalidades, lugares, vencimiento, cancelación, recordatorios, conservación y concesiones por UID.
- `/admin/clientes-potenciales`: búsqueda por POST, filtros y paginación, estados comerciales explícitos, contactos autorizados, notas/tareas, historial, duplicados sin fusión, exportación adicional auditada y supresión/retención.
- Meta Cloud API oficial y Resend en servidor, cola persistente y scripts Supabase Cron/pg_net/Vault. Webhooks firmados, deduplicación, leases, backoff, intentos/resultados y errores visibles. Guardado, aceptado y entregado son estados distintos.

## Disponibilidad y autorización

Timestamps UTC; presentación America/Santo_Domingo. Duración inicial 120 minutos, margen 30 y reserva provisional 12 horas, ajustable. No hay jornadas escolares o laborales inventadas. Cada inicio de 30 minutos exige que el intervalo completo quepa en la jornada y no choque con bloqueos/reservas/capacidad. La exclusión GiST sobre `[inicio, fin + margen)` protege incluso SQL directo; el bloqueo transaccional por agenda y la idempotencia resuelven solicitudes simultáneas y vencimientos.

Solo UID verificado y concesión explícita del módulo. Un SUPERADMIN necesita además autorización específica; un admin/empleado Ramaldi no hereda la agenda o CRM. Técnicos con facultades separadas de CRM/exportación/avisos/permisos. Rutas, acciones, RPC y RLS verifican permisos. No hay otra instancia Auth, base de datos ni `service_role`.

## Migración y archivos

`supabase/migrations/20261021_appointments_crm.sql` añade **17 tablas**: appointment_settings, appointment_access_grants, appointment_availability_rules, appointment_blackouts, appointments, appointment_proposals, appointment_reservations, appointment_history, appointment_customer_grants, leads, lead_notes, lead_tasks, notification_jobs, notification_attempts, notification_delivery_events, appointment_rate_limits y appointment_runtime. Historial compartido de agenda/CRM evita otra tabla redundante de actividades. Restricciones, índices/RLS y funciones transaccionales acompañan al esquema.

Scripts operativos separados: preflight de solo lectura, bootstrap de UID real, Cron y pausa reversible. No ejecutados en producción. Todas las migraciones anteriores, cuentas, propiedades, imágenes y publicaciones permanecen.

Archivos nuevos principales: `src/lib/appointments/*`, `src/components/appointments/*`, rutas públicas/privadas/API de citas/CRM/webhooks, `src/data/get-booking-properties.ts`, suites `tests-appointments` y `tests-db/appointments.test.mjs`, documentación `APPOINTMENTS-*`. Cambios pequeños en HomeContent/ficha real, AdminBar/entrada de admin, sitemap/robots, `.env.example`, package/lock y CI. Actualizados README/AGENTS/CLAUDE/HANDOFF/CHANGELOG/ROADMAP conservando entradas históricas.

## Claude y doble identidad

PR #11 de Claude/Yordi Lewis, head `3b1931f`, y PR #12, head `3567f70`, ya integrados en main al empezar. Atribución corroborada por commits y documentación. No existía agenda/CRM en la base inspeccionada. Hero foto/título, menú completo, tipografía/paleta, presentación estática, propiedades, Auth, CMS y arquitectura empresarial se conservan; la invitación y el CTA son adiciones puntuales.

El módulo pertenece a Thony, no al directorio corporativo. No activa Ramaldi ni altas públicas; no inventa empleados o inmuebles. La recepción pública se cierra fuera del modo Thony, pero conserva gestión privada de citas existentes. Consultar de nuevo remoto/checks antes de integrar; no es posible observar trabajo privado no publicado de otro colaborador.

## Verificación y despliegue

- `npm ci`, lint, typecheck y builds: aprobados. CI del primer hito `12fa765`: [39647376832](https://github.com/JordyGomez/Thony-Ramaldi/actions/runs/39647376832), aprobado; comprobar también los checks del último commit del PR.
- PostgreSQL/RLS: 73 comprobaciones aprobadas, incluyendo las 38 anteriores y 35 nuevas de agenda. Scripts Cron/Vault/pausa ejecutados contra dobles SQL aislados; esto no equivale a ejecutarlos en Supabase gestionado.
- **214 comprobaciones locales aprobadas, sin fallos ni omitidas**: 73 SQL, 84 regresiones de la web, 8 públicas sin fixtures, 13 del panel anterior, 17 empresariales y 19 de agenda. Después se verificó además la captura PC/móvil y se reforzaron las denegaciones SQL directas; ambas comprobaciones aprobaron. La recuperación de contraseña existente sigue cubierta por la suite empresarial.
- Capturas PC/móviles revisadas, sin scroll horizontal y auditoría axe en Chromium. CI conserva `agenda-capturas` con imágenes de datos exclusivamente aislados. No se afirma prueba en Safari ni teléfonos físicos. Las advertencias de optimizador al rechazar loopback son propias de las fixtures; se mantiene la protección SSRF de producción.

La rama se entrega mediante PR #13 y [Preview del Vercel existente](https://thony-ramaldi-git-feat-thony-appointments-pri-68a4aa-los-yordis.vercel.app/citas). El primer hito compiló correctamente en Vercel; el acceso externo devuelve 302 a SSO y no se eludió esa protección. Preview bloquea nuevas reservas, mutaciones, exportaciones y envíos reales; permite revisión autorizada de la interfaz/lecturas disponibles. No se crea dominio/proyecto nuevo ni se fusiona una implementación parcial.

## Qué funciona y qué falta activar

El código, SQL y flujos aislados funcionan con datos y servicios de prueba locales. **No se instaló la migración ni se activaron reservas o proveedores en el proyecto real.** La consulta pública del Supabase real devuelve properties disponible y ausencia/no exposición de las tablas nuevas en PostgREST; no hubo introspección privilegiada ni escrituras en Auth/Storage/DB. No se enviaron mensajes a números/correos reales.

El propietario del proyecto existente debe completar, conforme a APPOINTMENTS-OPERATIONS:

1. Preflight/respaldo y migraciones del editor, doble identidad y agenda; UID verificado de Thony y permisos expresos.
2. Secreto de servidor en Vercel/Vault, otro de firma de enlaces, Turnstile y Cron/pg_net con permisos privados, heartbeat comprobado y jornadas reales introducidas por Thony.
3. Resend: API key, dominio/remitente verificado y signing secret de webhook.
4. Meta: cuenta empresarial, remitente verificado diferente del destinatario de Thony, token, versión compatible, plantillas UTILITY aprobadas de 13 parámetros, app secret y verificación de webhook. Consentimientos necesarios.
5. Aceptación operativa con personas internas autorizadas y datos legítimos; revisión de cuotas/costos y habilitación expresa de recepción.

La ausencia de un proveedor no impide guardar una reserva válidamente habilitada; el aviso queda bloqueado y visible. Ausencia del esquema/servicio/CAPTCHA/jornadas mantiene recepción cerrada, sin horarios o mensajes inventados. El usuario ya explicó que no tiene acceso a Supabase: no debe pedírsele otra vez ni solicitar secretos por chat.

La pausa cierra recepción y puede detener Cron sin borrar datos; detenerlo también detiene recordatorios y exige coordinar citas confirmadas. Reversión de código por PR/despliegue conocido, conservando tablas. Propuestas rechazadas/vencidas mantienen la cita original, sin eliminar clientes/historial.

# Instalación y operación de citas

## Estado real y responsables

El código se prepara en la rama de citas sobre main `cb4e376`. No se ejecutaron las migraciones en el Supabase real ni se crearon citas, clientes o mensajes reales durante desarrollo. No hay credenciales de Meta, Resend ni administración de Supabase disponibles en esta sesión. El usuario ya indicó que no tiene acceso a Supabase: estos pasos los realiza su propietario, sin compartir contraseñas o tokens en el chat.

La agenda no se activa por publicar código. Sin esquema, propietario verificado, autorización específica, jornadas reales y requisitos del servidor, muestra su estado pendiente. Las reservas permanecen cerradas de manera predeterminada. La infraestructura no activa Ramaldi ni concede acceso empresarial a clientes de Thony.

## Secuencia de instalación

1. Revisar el PR de citas, sus checks y Preview. Repetir fetch y comparar cambios de Claude antes de integrar. Confirmar el dominio y proyecto de Vercel existentes; no crear otros.
2. Ejecutar [appointments-preflight.sql](../supabase/ops/appointments-preflight.sql) como propietario. Inspeccionar tablas, funciones, triggers, RLS, índices, relaciones y permisos reales. Si ya existe una tabla con alguno de los nombres propuestos, comparar su finalidad y estructura antes de adoptar el nombre. El script de preflight solo consulta metadatos.
3. Obtener un respaldo recuperable del esquema y registros actuales, Auth y manifiesto/archivos de Storage. Probar la restauración en un entorno aislado. Anotar la versión desplegada y el estado de las migraciones anteriores.
4. Si faltan, revisar e instalar primero `20261018_site_editor.sql` y `20261020_dual_mode_platform.sql`. Mantienen Thony activo y no otorgan SUPERADMIN automáticamente. No volver a ejecutar indiscriminadamente el esquema inicial con su correo de ejemplo.
5. Aplicar `20261021_appointments_crm.sql`: transaccional, aditiva y repetible. Requiere btree_gist, crea las tablas privadas/RPC y conserva propiedades, usuarios, archivos, CMS y las dos identidades. No contiene horarios de universidad, cuentas de prueba ni anuncios.
6. Identificar la cuenta **real y verificada** de Thony en Supabase Auth, cuyo correo profesional es `brokerthonypaulino@ramaldigroup.com`. El correo sin un UID explícito no concede acceso. Usar [bootstrap-appointments.sql](../supabase/ops/bootstrap-appointments.sql) con ese UID; el ejemplo vacío aborta. No reasigna automáticamente una agenda que ya tenga otro propietario.
7. Guardar en Supabase Vault un secreto aleatorio de al menos 32 bytes con nombre `thony_appointments_server_secret`. El bootstrap conserva su SHA-256 en una tabla inaccesible a clientes. Configurar el mismo valor como `APPOINTMENTS_SERVER_SECRET` en Vercel Production. Generar **otro secreto** para `APPOINTMENTS_LINK_SIGNING_SECRET`; no reutilizar el de servicio.
8. Configurar las variables descritas en `.env.example` y en [proveedores](APPOINTMENTS-NOTIFICATIONS.md). Los secretos solo se introducen en las consolas autorizadas de Vercel/Vault/proveedores. Nunca se guardan en Git, HTML, variables NEXT_PUBLIC ni capturas.
9. Integrar el código revisado mediante PR y verificar el despliegue de producción existente. Preview permite revisar interfaz y lectura, pero bloquea reservas, modificaciones, exportaciones y envíos reales.
10. Habilitar Cron/pg_net en el Supabase existente y revisar [appointments-cron.sql](../supabase/ops/appointments-cron.sql). Instala un trabajo por minuto con Vault y una ruta autenticada del dominio actual. El comando del cron no contiene el token literal; no usa service_role ni depende de un navegador.
11. Comprobar `cron.job_run_details`, las respuestas HTTP de pg_net y el heartbeat del panel. Registrar una programación no demuestra que el worker haya recibido la petición. Las nuevas reservas se cierran si no recibe una ejecución durante cinco minutos.
12. Thony introduce días y horas reales, excepciones, vacaciones y bloqueos; revisa duraciones y márgenes, modalidades, lugares, cancelación y conservación. Acepta expresamente los avisos de WhatsApp propios si desea utilizarlos.
13. Autorizar técnicos por UID verificado y SUPERADMIN previo desde la configuración de agenda. CRM, exportación, avisos y administración de permisos son facultades separadas. No promover administradores o empleados existentes automáticamente.
14. Validar el flujo con personas internas expresamente autorizadas y datos legítimos, sin usar números o clientes ajenos como pruebas. Solo entonces habilitar recepción pública. Los proveedores pueden permanecer desactivados: la solicitud se conserva y el panel indica qué avisos no se enviaron.

## Horarios y aprobación

En `/admin/citas/configuracion`, añadir jornadas semanales y fechas extraordinarias. Para un día/semana de ausencia, registrar un rango de fechas; para clases o estudio, un bloqueo semanal con fechas de vigencia. El motivo queda privado. No se consulta un calendario universitario externo.

Duraciones iniciales 120 minutos por tipo y margen de 30 minutos. Permite 60/90/120 y duraciones autorizadas de 30 a 480 minutos en pasos de 15. Los posibles inicios siguen una rejilla de 30 minutos, pero la base exige que la duración completa y el margen encajen. Un cambio de duración afecta nuevas solicitudes, no las ya comprometidas.

En `/admin/citas`, revisar la pendiente, instrucciones reales y notas internas; confirmar, rechazar con motivo privado o proponer otra fecha. Las reservas pendientes vencen inicialmente a las 12 horas, o antes del inicio cuando corresponda. Un vencimiento no se confirma tardíamente: debe solicitarse otro intervalo.

Una propuesta conserva la cita confirmada anterior y bloquea provisionalmente la nueva. No se considera aceptada hasta la intervención de la otra parte. Rechazar/vencer una propuesta restaura la cita original; aceptar intercambia reservas y recalcula avisos de manera atómica. Canceladas/rechazadas/vencidas no bloquean; completadas/inasistencias conservan historial.

## CRM y consentimiento

El CRM busca en servidor y pagina resultados; nunca pone nombre, correo ni teléfono en la URL de búsqueda. Detecta coincidencias sin fusionar personas. Las notas y tareas son privadas. Finalizar una cita no cierra automáticamente una oportunidad comercial.

Relacionar una solicitud finalizada con otra ficha requiere verificación humana explícita. No mueve notas ni mezcla contactos. Revoca sus capacidades anteriores para impedir que la persona del enlace original vea datos de la ficha de destino.

El cliente recibe un enlace personal firmado en fragmento y lo intercambia por una cookie HttpOnly/SameSite, limitada a la API de su propia cita. Puede consultar, cancelar según política, responder o proponer un cambio, gestionar WhatsApp y descargar ICS si existe confirmación real. Sus enlaces no son credenciales de administración.

La exportación CSV requiere permiso adicional y queda auditada; neutraliza fórmulas de hoja de cálculo y no incluye notas. Mantener el archivo privado. La eliminación exige resolver citas activas, revoca enlaces y suprime contactos/notas/payloads; conserva un historial mínimo sin esos datos. La limpieza automática aplica el plazo de inactividad configurado, 365 días iniciales; no supone que cada registro debe borrarse a los 365 días de su creación.

## Fallos, pausa y recuperación

- HTTP 409: otro cliente obtuvo el intervalo o la revisión cambió. No descartar borradores locales ni confirmar una solicitud vencida.
- Proveedor desactivado/dominio sin verificar: trabajos bloqueados, sin fecha de envío. Corregir la integración y usar «Procesar avisos pendientes»; vuelve a comprobar bloqueados vencidos, sin adelantar recordatorios futuros.
- Red o límite del proveedor: reintentos con backoff y límite, dentro de la ventana segura de idempotencia. Estados inciertos requieren revisar webhook/consola del proveedor; no reenviar con una clave nueva a ciegas.
- Caída del worker: lease persistente y recuperación. Un intento Meta interrumpido puede haber sido aceptado; queda incierto. El callback puede reconciliarlo. Resend reutiliza una clave/payload estable dentro de su ventana.
- Cron detenido: revisar job/HTTP/secretos/Vault y heartbeat. La aplicación no oculta la caída mostrando una agenda inventada.
- Pausa revisada con [appointments-pause.sql](../supabase/ops/appointments-pause.sql): cierra recepción y detiene su cron, conservando registros y permisos. **Detener Cron también detiene recordatorios**, por lo que deben coordinarse las citas confirmadas.
- Reversión de código: revisar un PR de revert o restaurar un despliegue conocido mediante el Vercel existente. Conservar las tablas; no ejecutar DROP, vaciar clientes o reinstalar Auth para volver a una versión previa.
- Rotación: cambiar el secreto de servicio tanto en Vault como Vercel y renovar su hash SQL. El cambio descoordinado detiene el servicio. Rotar la firma invalida enlaces anteriores; revisar/reemitir los necesarios por un canal autorizado, sin dar capacidades de administración. No cambiar el payload de un envío incierto mientras conserve una clave de idempotencia del proveedor.

No hay garantía de retirar un mensaje que el proveedor ya aceptó. La cancelación invalida trabajos pendientes y se verifica otra vez justo antes del envío; una petición externa ya en curso debe reconciliarse con su resultado real.

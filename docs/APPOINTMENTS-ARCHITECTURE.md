# Agenda y CRM privados de Thony

Implementación en `feat/thony-appointments-private-crm`, desde main `cb4e376` (PR #12 integrado). No se reemplazan Next.js, Supabase Auth, el panel ni las identidades Thony/Ramaldi. No se crea otro Vercel, repositorio ni base de datos gestionada.

## Revisión de colaboración

Se revisaron Git local limpio, fetch/prune, ramas por API de GitHub, commits y PR abiertos. PR #11 de Claude/Yordi Lewis (`3b1931f`, título y foto sin textos secundarios) y #12 (`3567f70`, doble identidad) ya estaban integrados. No había una agenda, CRM o notificaciones en el código inspeccionado. Se conservan hero, paleta/estilos públicos, Auth, propiedades, editor y publicación. La nueva invitación y el botón de visita se añaden sobre esos componentes. El trabajo privado no publicado por otros colaboradores no es observable.

La lectura anónima del proyecto real confirmó properties disponible y ausencia en PostgREST de platform_state, appointments, appointment_settings y leads. No equivale a introspección privilegiada de todas las tablas/políticas reales. No se ejecutó DDL ni se crearon usuarios, citas, clientes o mensajes en producción. El usuario ya indicó que no tiene acceso a Supabase; la instalación corresponde al propietario del proyecto.

## Componentes

- `/citas`: flujo por tipo, fecha, hora, datos, revisión y recepción pendiente. Solo propiedades verificadas, publicadas y autorizadas en el catálogo personal. Sin inventario se permiten consultas generales; no se inventan inmuebles.
- `/citas/seguimiento`: capacidad personal firmada, con fragmento que se intercambia por cookie HttpOnly; sin cuenta nueva, sin acceso a administración. No indexable, sin scripts de terceros ni PII en metadatos.
- `/admin/citas`: métricas reales, día/semana/mes/lista, reservas, propuestas, observaciones y estados. `/admin/citas/configuracion`: jornadas, excepciones, bloqueos, duraciones/márgenes, permisos y requisitos operativos.
- `/admin/clientes-potenciales`: búsqueda en servidor por POST, estados comerciales explícitos, notas, tareas, duplicados sin fusión automática, historial y CSV autorizado/auditado.
- `/api/internal/appointments/process`: procesador Node, autenticado con secreto de servidor, invocado cada minuto desde Supabase Cron/pg_net. No depende de pestañas ni de procesos locales permanentes.
- `/api/webhooks/appointments/meta` y `/resend`: firma sobre cuerpo sin alterar, destinatario/remitente y correlación con trabajos conocidos. Un webhook es la única evidencia de entrega.

## Datos y permisos

`appointment_settings` identifica establemente la agenda y sus reglas; no implica una organización empresarial. `appointment_access_grants` vincula UID verificado y autorización específica. Ser admin personal, empleado o SUPERADMIN global no concede acceso automáticamente. El propietario se vincula por SQL revisado; los técnicos requieren SUPERADMIN previo y concesión expresa del módulo. El CRM, la exportación, gestión de permisos y los avisos tienen permisos adicionales.

Tablas de jornadas y bloqueos no revelan motivos al visitante. `appointments` conserva snapshots de duración, margen y propiedad consultada; `appointment_reservations` guarda rangos excluyentes; `appointment_proposals` mantiene las propuestas sin soltar el original confirmado. `leads`, notas y tareas pertenecen a la agenda, con relaciones de integridad por calendario. `appointment_history` conserva actores y transiciones. Las capacidades de clientes, runtime/rate limits, cola, intentos y eventos de entrega son privados.

RLS en todas las tablas nuevas, sin DML directo por clientes. Las RPC de administración repiten permisos y revisión esperada. Helpers internos sin EXECUTE para navegadores. Las RPC del backend requieren un secreto aleatorio cuya huella está protegida en SQL; se usa el cliente publishable, sin una clave service_role. Los secretos de envío/firma nunca tienen prefijo NEXT_PUBLIC.

## Disponibilidad y concurrencia

Zona única `America/Santo_Domingo`; instantes timestamptz/UTC. Jornadas semanales y extraordinarias configuradas por Thony; sin jornada inicial inventada. Inicios cada 30 minutos, duración configurada por tipo (120 minutos iniciales) y margen posterior (30 minutos iniciales). Todo el rango debe caber en la jornada, sin bloqueo, fuera de anticipación mínima y dentro del horizonte/capacidad diaria.

La exclusión GiST compara calendario, cita e intervalo `[inicio, fin + margen)`. Dos citas distintas no pueden solaparse ni mediante escrituras SQL directas. La misma cita puede mantener su original y una propuesta parcialmente solapados. Un bloqueo transaccional por agenda serializa asignación, vencimientos, cambios y bloqueos; restricciones únicas impiden dos originales activos o dos propuestas abiertas.

Antes de asignar se resuelven vencimientos y se recalcula disponibilidad. Una petición idempotente conserva la misma solicitud; cambiar su payload con la misma clave se rechaza. Si dos solicitudes compiten, solo una obtiene el intervalo y la otra recibe conflicto. Las ediciones de configuración no cambian duraciones/horarios ya comprometidos.

## Estados y propuestas

Pendiente tiene reserva exclusiva con vencimiento de 12 horas iniciales, acotada antes del inicio. Solo Thony/técnico autorizado puede confirmar. Rechazo, cancelación y vencimiento liberan intervalos. Una terminal no vuelve automáticamente a pendiente. Completada/inasistencia requieren que el encuentro haya terminado o que haya transcurrido el mínimo de espera.

Una propuesta conserva el original confirmado y reserva otro intervalo con vencimiento. Quien la propuso no puede aceptar en nombre de la otra parte. Al aceptar, el intercambio de rangos/estado y la regeneración de avisos son atómicos. Al rechazar o vencer se restaura la situación original. El cliente puede proponer un cambio de su cita confirmada; Thony debe aceptarlo. Las notas internas no viajan al cliente.

## Identidades, privacidad y disponibilidad del servicio

La recepción pública se habilita solo en Thony; no activa Ramaldi ni comparte clientes con su directorio. Las citas existentes conservan gestión privada y avisos aunque después cambie la identidad pública. Los vínculos y mensajes usan la identidad de Thony, nunca contactos corporativos de reserva.

Preview bloquea las nuevas reservas, cambios de datos y envíos reales. Las pruebas completas usan únicamente HTTP en loopback, Auth/Storage/proveedores simulados y PostgreSQL/RLS reales embebidos. Las páginas existentes siguen funcionando si la migración no está instalada: la agenda muestra su estado pendiente y no ofrece horarios ficticios.

La recepción en línea requiere CAPTCHA, firma de enlaces, servicio y heartbeat de Cron reciente. Si el procesador no responde en cinco minutos, se cierran nuevas solicitudes. La caída de WhatsApp/correo no impide guardar una reserva válida: los trabajos quedan bloqueados o en reintento, con estado visible. No se afirma disponibilidad contractual ni entrega sin evidencia.

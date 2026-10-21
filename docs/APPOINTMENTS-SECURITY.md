# Seguridad y privacidad de citas

## Ámbito y autorización

La agenda inicial pertenece exclusivamente a Thony. `appointment_settings.owner_user_id` debe asignarse explícitamente a su UID de Supabase Auth verificado; el bootstrap compara también el correo profesional previsto. Ni un correo coincidente ni `admin_users`, una membresía Ramaldi o SUPERADMIN global otorgan acceso por sí solos.

`appointment_access_grants` separa gestión de citas, lectura CRM, exportación, avisos y administración de permisos. El propietario autorizado puede gestionar concesiones técnicas; cada técnico necesita UID verificado, SUPERADMIN vigente y concesión específica. Retirar SUPERADMIN invalida su acceso inmediatamente aunque una concesión antigua siga almacenada. La cuenta propietaria no puede reemplazarse desde el navegador.

Las rutas privadas comprueban sesión mediante `getUser()`, permiso y origen. Las RPC repiten las comprobaciones; todas las tablas nuevas tienen RLS y carecen de escritura directa para `anon`/`authenticated`. Los ayudantes de escritura no tienen EXECUTE público. Un asesor o administrador sin concesión no puede consultar el CRM ni invocando directamente PostgREST. Payloads, tokens de claim, capacidades y runtime no se exponen en los SELECT de auditoría.

## Frontera del servidor

El backend usa la clave publishable existente junto con un secreto de servicio aleatorio; SQL compara su SHA-256 privado. No se usa `service_role`. El secreto de firma de enlaces es independiente. Los secretos de proveedores solo existen en servidor/Vault; `.env.example` contiene nombres vacíos, nunca valores reales.

El endpoint público de disponibilidad exige pasar por el servidor, con límite persistente por IP y sin motivos privados. Las reservas requieren validación estricta, origen, honeypot, Turnstile verificado en servidor (action/hostname) y límites de IP/contacto. No se aceptan estado, propietario o permisos del visitante. El almacenamiento utiliza restricciones compuestas de calendario/cliente/propuesta y exclusión temporal GiST; la protección no depende de botones deshabilitados.

Los límites de aplicación complementan los de Vercel/Cloudflare. Si se configura un proxy distinto de Vercel, debe sobrescribir las cabeceras de IP confiables. El SQL de servicio está destinado únicamente al backend; no revelar el secreto para permitir consultas del navegador.

## Enlaces de clientes

UUID y nonce aleatorios, firma HMAC, caducidad y scopes concretos. El enlace viaja en fragmento; el navegador lo intercambia por cookie HttpOnly, SameSite=Strict, Secure en HTTPS y limitada a `/api/citas`. Se retira el fragmento tras el intercambio. Cambiar un UUID no concede acceso a otra solicitud. No hay tokens de administración en mensajes ni URLs.

La base comprueba de nuevo vigencia, revocación y pertenencia dentro de la transacción. Una relación manual con otra ficha revoca capacidades previas y cancela avisos pendientes, evitando mostrar a la persona anterior los contactos de destino. Las páginas de seguimiento son privadas/noindex/no-referrer. Quien tenga el enlace vigente puede gestionar esa cita: debe tratarse como una credencial privada y revocarse si se expone.

## Consentimiento y minimización

Se registran versión/fecha del consentimiento operativo y autorización separada de WhatsApp. No se incluye marketing. El cliente puede retirar WhatsApp sin cancelar la cita; los envíos consultan el consentimiento vigente. El propietario autoriza también los avisos a su número. Los enlaces manuales de contacto se identifican como tales: `wa.me` no se presenta como envío automático.

Búsquedas del CRM por POST: no poner nombres, teléfonos ni correos en la URL. Exportación adicional autorizada y auditada, sin notas y con neutralización de fórmulas CSV. Límite 10000 fichas: se rechaza una exportación mayor en lugar de truncarla silenciosamente. Los archivos exportados siguen siendo datos privados y requieren custodia.

Plazo inicial: 365 días de inactividad, configurable entre 30 y 1825. La limpieza excluye citas activas y vuelve a comprobar elegibilidad bajo bloqueo. Suprime contactos, comentarios, notas, tareas y payloads con PII, revoca enlaces y conserva un historial mínimo de estados. No fusiona automáticamente personas con teléfono/correo compartido. No se solicitan documentos de identidad.

## Proveedores, ejecución y fallos

Meta HMAC y Resend/Svix verifican el cuerpo original, correlacionan con un trabajo existente y deduplican eventos. Un POST de envío aceptado no equivale a entrega. La cola distingue bloqueado, reintento, aceptado, entregado, fallido e incierto. Un timeout Meta no se reenvía a ciegas; un webhook firmado puede resolverlo. Resend mantiene clave y payload dentro de su ventana de idempotencia.

Cron se instala únicamente por el propietario, lee Vault y llama una ruta autenticada. Antes de instalar se inspeccionan permisos reales de Vault/pg_net: la cola de pg_net puede contener cabeceras Authorization y no debe ser legible por clientes. La función de cron no concede EXECUTE a clientes. Heartbeat vencido cierra nuevas reservas; el panel muestra estados reales.

Una cancelación invalida trabajo pendiente y el worker lo revisa justo antes de enviar. No puede retirarse una petición externa ya aceptada por el proveedor; el resultado se conserva con su evidencia. No registrar cuerpos de proveedores, datos de clientes o secretos en logs de aplicación.

## Límites de verificación

Las pruebas usan PostgreSQL/RLS embebidos y servicios HTTP aislados. No prueban por sí solas los permisos instalados, Vault, SMTP, Auth real, cuenta Meta, dominio Resend o ejecución de Cron del Supabase gestionado. Antes de activar, el propietario debe revisar esquema/políticas reales, respaldo restaurable, UID y proveedores conforme a [operación](APPOINTMENTS-OPERATIONS.md). No se ejecutó DDL ni se escribieron clientes/citas de prueba en producción.

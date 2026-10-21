# Avisos oficiales y recordatorios persistentes

## Selección de proveedores y estado auténtico

Se seleccionan **Meta WhatsApp Cloud API**, **Resend** y **Supabase Cron + pg_net + cola PostgreSQL**, reutilizando Next/Vercel como procesador seguro. Meta evita automatizar WhatsApp Web; Resend ofrece dominio verificado, idempotencia y webhooks firmados. Cron por minuto se ajusta a recordatorios precisos; no se depende de las limitaciones de Vercel Cron del plan existente ni de una pestaña abierta.

No se crean cuentas comerciales ni servicios de pago en esta tarea. Meta puede cobrar por plantillas según categoría/mercado; Resend tiene cuotas y planes; Supabase/Vercel aplican las del proyecto existente. El propietario debe revisar las tarifas y límites actuales antes de activar. No se promete gratuidad ilimitada.

**No hay mensajes reales enviados ni credenciales activadas desde esta sesión.** Las comprobaciones integradas usan proveedores HTTP ficticios exclusivamente en loopback. Tener una solicitud guardada o una credencial presente no significa enviado o entregado.

## WhatsApp

Necesita una app de Meta, WhatsApp Business Account, remitente registrado/verificado, token de servidor con permisos correspondientes, consentimiento y plantillas aprobadas de categoría UTILITY. El destinatario de avisos de Thony es `+18294045770`. Debe usarse un remitente oficial diferente: no presentar el envío a sí mismo como una integración funcional.

Variables: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_API_VERSION` (versión compatible de la app, sin inventarla), `WHATSAPP_TEMPLATE_OWNER`, `WHATSAPP_TEMPLATE_CLIENT`, `WHATSAPP_TEMPLATE_LANGUAGE` (es inicial), `WHATSAPP_APP_SECRET` y `WHATSAPP_VERIFY_TOKEN` (aleatorio, al menos 32 caracteres).

El procesador consulta remitente y aprobación de las plantillas antes de enviar. Usa siempre plantillas para no depender de una ventana de conversación abierta. Registrar dos plantillas operativas con **13 parámetros de texto numerados** en BODY, en este orden:

1. Evento/título.
2. Nombre del cliente.
3. Teléfono del cliente.
4. Correo del cliente.
5. Tipo de cita.
6. Referencia/título verificado, o consulta general.
7. Fecha en República Dominicana.
8. Hora en República Dominicana.
9. Duración.
10. Modalidad.
11. Estado auténtico.
12. Comentario operativo: los privados solo se incluyen en el aviso a Thony.
13. Enlace: panel con login para Thony; capacidad propia y caducable para el cliente.

La plantilla debe contener texto fijo suficiente y describir solicitudes pendientes, confirmaciones, propuestas, cancelaciones y recordatorios sin afirmar una confirmación para todos los eventos. La aprobación la decide Meta; el código no la simula. No configurar botones con parámetros adicionales sin adaptar el contrato. No copiar datos ficticios de los tests a producción.

Registrar webhook `https://thony-ramaldi.vercel.app/api/webhooks/appointments/meta`, validar challenge con un token independiente y suscribir estados de mensajes. Cada POST usa HMAC-SHA256 `X-Hub-Signature-256`, filtra el phone_number_id esperado y correlaciona provider_id o biz_opaque_callback_data con un trabajo existente. «read» cuenta como entrega; duplicados no degradan estados. El token de challenge es solo para esa verificación; nunca sustituye al app secret de firma.

El cliente autoriza WhatsApp por separado, sin publicidad, y puede retirar esa autorización desde su enlace. Thony autoriza su propio número desde configuración. Los trabajos se comprueban contra el consentimiento vigente antes de enviarse.

## Correo

Variables: `RESEND_API_KEY`, `RESEND_DOMAIN_ID`, `APPOINTMENTS_EMAIL_FROM` y `RESEND_WEBHOOK_SECRET`. El remitente no tiene valor ficticio de reserva. Su dominio debe coincidir con el verificado en Resend; una clave sin permiso para consultar el dominio deja el canal bloqueado hasta configurar la autorización apropiada. Reply-To es el correo profesional autorizado de Thony.

Plantillas en español, HTML claro adaptable a móvil y alternativa de texto: recepción pendiente, confirmación, rechazo, propuesta, reprogramación, cancelación, vencimiento y ambos recordatorios. Datos escapados, instrucciones confirmadas y enlace funcional. Solo una confirmación/reprogramación real adjunta un ICS UTC, con UID estable, secuencia y líneas plegadas conforme al formato.

Registrar `https://thony-ramaldi.vercel.app/api/webhooks/appointments/resend` y su signing secret. Se verifica el cuerpo original con el SDK Svix y cabeceras firmadas, incluida tolerancia temporal; después se interpreta JSON. Un evento válido se correlaciona con email_id o tag de trabajo conocido. No se da por entregado con un simple HTTP 200 de la API de envío.

## Cola, reintentos y garantías

`notification_jobs` guarda una clave única por cita/evento/generación/destinatario/canal, snapshot privado, fecha, lease, intentos y resultado. `notification_attempts` conserva cada procesamiento; `notification_delivery_events` deduplica callbacks. Los payloads y capacidades no se exponen mediante SELECT de auditoría.

Estados: pendiente, procesando, integración bloqueada, reintento, aceptado por el proveedor, entregado, fallido, cancelado e incierto. Un canal bloqueado no consume un intento de envío. No guardar tokens de proveedor, cuerpos de error con PII o secretos en last_error.

Resend recibe `Idempotency-Key: thony-agenda/<job UUID>` y un payload estable. Su ventana documentada es 24 horas; la recuperación usa un margen de 23 horas. Meta no tiene la misma garantía: un timeout tras aceptar el mensaje queda incierto, no se reenvía ciegamente. El callback firmado puede reconciliar el resultado. Errores explícitos transitorios/429 se reintentan con backoff limitado; se conserva evidencia sin afirmar un envío inexistente.

Se cancelan avisos obsoletos al cancelar, rechazar, vencer, reprogramar o retirar consentimiento. Antes del POST se verifica otra vez el evento, generación, horario y consentimiento. Un envío ya aceptado por una API externa no puede retirarse mediante una transacción local; su resultado se registra según la evidencia real.

## Planificación

Instalar manualmente `supabase/ops/appointments-cron.sql`; no lo ejecuta una visita a la web. Cada minuto llama una ruta POST con Authorization Bearer desde Vault. El worker reclama trabajos vencidos con locks/leases, tolera concurrencia, procesa en lotes pequeños y persiste resultados. No hay setTimeout de navegador ni servidor local permanente para enviar avisos.

- Primer aviso: inicio menos 24 horas. No se crea si ese momento ya pasó al confirmar.
- Segundo: 07:00 America/Santo_Domingo, configurable por Thony. Si la cita es temprana o está demasiado cerca, se adelanta hasta una hora antes del inicio. Si ese momento también pasó, no se envía un aviso retroactivo.
- Solo para el horario confirmado vigente. Si hay una propuesta, el original confirmado se conserva hasta aceptar el cambio. Al aceptar se invalidan los anteriores y se recalculan.
- Los recordatorios tienen una vigencia corta, como máximo una hora y siempre antes del inicio, para no enviar avisos atrasados. Las notificaciones operativas de estado no quedan pendientes indefinidamente.
- La cola y planificación sobreviven a reinicios/redeploy. Monitorear ejecución y entrega por separado: un cron programado o un trabajo reclamado no son evidencia de WhatsApp/correo entregados.

## Fuentes oficiales consultadas

- [Supabase Cron](https://supabase.com/docs/guides/cron) y [programación con pg_net/Vault](https://supabase.com/docs/guides/functions/schedule-functions).
- [Meta: plantillas de WhatsApp](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates/) y documentación vigente de la cuenta/app para aprobación, permisos y costos.
- [Resend: envío](https://resend.com/docs/api-reference/emails/send-email), [idempotencia](https://resend.com/docs/dashboard/emails/idempotency-keys) y [verificación de webhooks](https://resend.com/docs/dashboard/webhooks/verify-webhooks-requests).
- [Turnstile: validación de servidor](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/): tokens con caducidad y un solo uso, action/hostname verificados.

Las consultas a documentación no sustituyen la verificación de una cuenta/remitente/plantilla real. Esa activación requiere al propietario y a proveedores autorizados.

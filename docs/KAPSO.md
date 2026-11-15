# Kapso y WhatsApp

Fuente: skill oficial `integrate-whatsapp` de `gokapso/agent-skills` (commit `415c1b4`) y sus referencias. No hay MCP de Kapso conectado ni credenciales en este entorno: **nada se probó contra una cuenta real**.

## Qué existía

Avisos de citas por Meta WhatsApp Cloud API directa, con cola persistente, idempotencia, consentimiento y webhook firmado. Preparado, sin credenciales activas.

## Qué se añadió

Kapso como transporte alternativo de esos mismos avisos. Kapso expone un proxy de la API de Meta (`https://api.kapso.ai/meta/whatsapp/<versión>`) con cabecera `X-API-Key`, así que plantillas, parámetros y estados no cambian.

| Variable | Uso |
| --- | --- |
| `WHATSAPP_TRANSPORT` | `meta` (por defecto) o `kapso` |
| `KAPSO_API_KEY` | Clave del proyecto Kapso |
| `KAPSO_WEBHOOK_SECRET` | Secreto de firma del webhook |

Se siguen usando `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_API_VERSION` y las plantillas.

- Un solo transporte activo. Con `kapso`, el webhook de Meta responde 404; sin `kapso`, el de Kapso responde 503.
- Webhook: `/api/webhooks/appointments/kapso`, de tipo «meta» en Kapso para el número remitente. Se verifica `X-Webhook-Signature` (HMAC-SHA256 hexadecimal del cuerpo crudo) antes de leer el JSON.
- Los estados se registran con la misma RPC idempotente: un reintento no duplica nada.

## Pasos del propietario

1. Cuenta Kapso y conexión del número remitente (distinto del WhatsApp de Thony).
2. Plantillas UTILITY aprobadas con el contrato de 13 parámetros.
3. Webhook de tipo «meta» hacia la ruta anterior y su secreto.
4. Variables en Vercel y comprobación desde el panel de citas.

## No implementado

Reservas por WhatsApp, automatizaciones, asistente con IA, bandeja en el panel y llamadas. Requieren cuenta, autorización y decisiones de producto. Para la bandeja, Kapso ofrece un inbox incrustable (`POST /platform/v1/inbox_embeds`), preferible a duplicar una propia.

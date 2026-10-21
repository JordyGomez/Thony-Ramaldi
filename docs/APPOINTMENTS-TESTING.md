# Pruebas de citas y CRM

## Ejecución aislada

```bash
npm ci
npm run lint
npm run typecheck
npm run test:database
npx playwright install --with-deps chromium
npm run test:appointments
```

`test:database` ejecuta las suites SQL existentes y la de citas mediante PGlite/PostgreSQL con btree_gist. `test:appointments` compila Next y ejecuta Playwright contra `127.0.0.1:3401` y servicios ficticios en `127.0.0.1:3337`. Auth, Turnstile y las APIs de proveedores se simulan solo ahí; las funciones, restricciones GiST y RLS ejecutan el SQL real. No se reemplaza Supabase ni se crea una base gestionada.

Las suites que compilan (`test:admin`, `test:platform`, `test:appointments` y builds públicos) comparten `.next`: ejecutarlas **secuencialmente**. Los flags de fixtures están prohibidos en Vercel. Después recompilar normalmente para no dejar un build apuntando a servicios de pruebas. `.github/workflows/ci.yml` ejecuta regresiones, público sin fixtures, administración anterior, doble identidad y agenda de forma secuencial.

## Cobertura

- Migración repetible con recepción cerrada, sin horarios ni permisos inventados; conservación del modo Thony.
- Disponibilidad por intervalo UTC/República Dominicana, duración 60/90/120/personalizada, margen, jornada completa y clases/ausencias recurrentes.
- Exclusión GiST directa, solicitudes concurrentes HTTP/SQL, idempotencia, vencimiento y confirmación tardía rechazada.
- Estados y autorización: confirmación manual, rechazo, cancelación, propuestas, aceptación por la otra parte y conservación del original confirmado.
- Planificación 24 horas/07:00 RD, adelanto para citas tempranas, ausencia de retroactivos, configuración con revisión y regeneración sin duplicar aceptados.
- Consentimiento WhatsApp separado y retirada; cola persistente, claims concurrentes, fallos, backoff, incertidumbre, recuperación e idempotencia de proveedor.
- Webhooks Resend/Svix y Meta: firma inválida rechazada, evento válido, entrega real del doble HTTP, replay y no degradación de entregados.
- Denegaciones: visitante, agente, administrador legado y SUPERADMIN sin concesión; técnico sin CRM/exportación; cliente A frente a B; ayudantes SQL inaccesibles.
- CRM con búsqueda POST, duplicados sin fusión, notas/tareas, relación terminal revocando enlaces y retención que conserva citas activas.
- Interfaz completa, conflicto de edición conservando formulario, calendario PC/móvil, ausencia de overflow y auditoría axe en Chromium.

El doble de proveedores conserva payload/clave de Resend; una clave con datos distintos se rechaza. En el escenario incierto registra primero la aceptación y después corta la conexión: comprobar que no se duplica Meta al recuperar. No hay envíos de prueba a contactos reales.

Los recursos de fotografía del doble HTTP resuelven a loopback; el optimizador Next puede rechazarlos por SSRF. No habilitar `dangerouslyAllowLocalIP` en producción para eliminar ese aviso de laboratorio. Las pruebas de Storage anteriores siguen separadas.

## Alcance real

Consultar resultados y límites de la entrega en [APPOINTMENTS-DELIVERY.md](APPOINTMENTS-DELIVERY.md). Chromium con viewports móviles no equivale a probar Safari/iPhone/Android físicos. No se afirma entrega real Meta/Resend, ejecución gestionada de Supabase Cron, instalación SQL real o acceso autenticado a producción.

Para aceptación operativa, el propietario del Supabase existente aplica preflight/respaldo/migración/bootstrap/Cron y configura proveedores verificados. Realizar una comprobación autorizada con personas internas y datos legítimos, sin usar clientes ajenos, conforme a [APPOINTMENTS-OPERATIONS.md](APPOINTMENTS-OPERATIONS.md).

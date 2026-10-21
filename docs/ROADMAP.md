# Roadmap

## Implementada en código — agenda y CRM privados, 2026-10-21

- Reservas por pasos, disponibilidad en PostgreSQL, pendientes exclusivas con vencimiento, confirmación manual y propuestas seguras.
- Agenda día/semana/mes/lista, horarios semanales/extraordinarios, bloqueos privados, duración/margen y políticas editables por Thony.
- CRM privado, permisos separados por UID, notas/tareas/historial, búsqueda y exportación auditada.
- Cola persistente, recordatorios RD, Meta Cloud API y Resend con comprobaciones y webhooks, privacidad/retención y pruebas aisladas.
- Conservar Thony público y trabajo de Claude/doble identidad. Detalles de pruebas y revisión en APPOINTMENTS-DELIVERY.

## Pendiente de activación operativa — sin simular servicios

- Propietario Supabase: preflight, respaldo restaurable, migraciones anteriores/nueva, UID verificado de Thony y concesiones específicas.
- Configurar secretos diferentes, Vault/Cron/pg_net, Turnstile de reservas, jornadas reales y heartbeat; después habilitar recepción.
- Meta: cuenta/remitente distinto del destinatario, token, dos plantillas UTILITY aprobadas y webhook. Resend: cuenta, dominio/remitente verificado y webhook Svix. Revisar cuotas/costos actuales.
- Aceptación operativa autorizada en el proyecto existente, sin enviar a clientes ajenos ni crear datos ficticios de producción. No activa portal Ramaldi ni comparte prospectos.


## Preparada en rama — plataforma privada Thony/Ramaldi

- Una app y Supabase; identidades/configuración separadas y reversibles, sin trasladar inventario legado a una empresa por defecto.
- SUPERADMIN por UID verificado, selector privado y preview PC/móvil; cuentas empresariales por invitación, correo verificado y pertenencia aprobada.
- Perfiles con borrador/aprobación; propiedades propias, revisión/publicación, observaciones, documentos privados y planos tras aprobación.
- RPC/RLS, archivo empresarial privado, versiones/CAS, auditoría y snapshot coherente por petición; presentación estática conservada.
- Entrega por PR #12, basada en #11 de Claude. No está fusionada ni activada públicamente; Thony sigue siendo el modo de producción.

## Requisitos antes de una futura activación empresarial

- Revisión/integración coordinada de PR #11/#12, checks completos y autorización de despliegue de código.
- Propietario de Supabase: preflight, respaldo, migración del editor si falta, ampliación empresarial y bootstrap explícito de una cuenta verificada; no pedir al usuario acceso que ya indicó que no tiene.
- Configurar y comprobar hook de invitación, confirmación de correo, SMTP/recuperación, CAPTCHA y límites de Auth antes de habilitar incorporación.
- Aprobación corporativa verificable de identidad oficial, recursos, contactos, contenido y administración de empleados. Datos desconocidos vacíos, sin directorio ficticio.
- Validación real de cuentas y publicaciones autorizadas; activar solo desde el selector de SUPERADMIN con impacto revisado y confirmación. Reversión a Thony sin borrar datos.

## Dirección vigente — presentación estática

- Retirar la introducción de puerta, paralaje, entradas 3D, zoom y desplazamientos decorativos.
- Contenido inmediato y menú, filtros, carrusel y galería sin animación; conservar la composición de Claude.
- Normalizar configuraciones antiguas e historial a off/entry=false y retirar opciones de efectos del panel. Ver HANDOFF y checks de `fix/remove-decorative-motion`.

## Corrección — menú completo en todas las pantallas

- Panel fijo al viewport, separado de la cabecera animada y de sus filtros; sin ancho fijo de escritorio ni recorte horizontal.
- Respaldo sin JavaScript limitado por CSS; opciones completas al desplazarse, redimensionar y cambiar orientación, con foco y Escape.
- Botón y acción de importar Alberobello retirados; alta manual de propiedades conservada. Ver HANDOFF y checks de `fix/fullscreen-menu-and-remove-import`.

## Corrección — imagen del pie procedente del inventario

- Retirar la fotografía ilustrativa `villa.jpg` del pie; mantener firma y contactos sin hueco reservado.
- Mostrar una foto solo al existir una propiedad pública no demo con fotografías, excluyendo renders; actualizar con la publicación/ocultación/borrado del inventario existente.
- Selección propia opcional del panel, preview coherente y exclusión del recurso antiguo incluso desde configuraciones anteriores. Ver HANDOFF y checks de la rama `fix/footer-real-property-photo`.

## Terminada en código — restauración de Claude y administración integral

- Composición fotográfica de Claude con 3D por capas, revelados, menú, tarjetas, galería, controles y búsqueda personal.
- Edición de contenido/contactos/menú/SEO, fotos/logo, paleta, movimiento y orden/visibilidad de secciones.
- Subida por servidor con validación de sesión/rol/origen/archivo, progreso, diagnóstico y reintento; biblioteca reutilizable y conservación de archivos compartidos.
- Borradores privados, previsualización móvil/escritorio, publicación transaccional, historial y detección de conflictos; migración aditiva preparada.
- 111 comprobaciones locales aprobadas. Ver CLAUDE-ADMIN-REVIEW para alcance real y límites.

## Activación pendiente en el proyecto real

- El propietario ejecuta `supabase/migrations/20261018_site_editor.sql` en SQL Editor; comprobar luego tablas y permisos desde Configuración.
- Verificar con la cuenta real la primera subida y publicación. Los tests del panel usan Auth/Storage/PostgREST locales; no equivalen a haber iniciado sesión o ejecutado DDL real.
- Confirmar incorporación de logos originales y contenido/inventario autorizado desde el panel.


## Terminada — evolución cinematográfica sobre main 0742704

- Entrada de puerta sólida CSS y retrato real, adaptación desktop/móvil, relevo al hero, sesión y espera acotada.
- Hero, fotografía, menú, revelados, tarjetas, contacto y pie con movimiento moderado; sin motor 3D ni nuevas dependencias.
- Inventario solo publicado no demo; estado vacío profesional y fixtures explícitas aisladas de Vercel.
- Panel Supabase y políticas existentes conservados. Lectura pública real y acceso anónimo comprobados, sin escrituras.
- Regresiones y revisión de laboratorio/capturas en CINEMATIC-REVIEW; entrega en rama feat/cinematic-ramaldi-experience para Preview y PR.

## Terminadas — Fase 1 técnica

- Aplicación Next.js con TypeScript y estructura compartida.
- Dirección editorial, variables de color, fuentes locales y animaciones de interfaz.
- Portada, navegación adaptable, entrada por sesión y movimiento reducido.
- Rediseño minimalista oscuro inspirado en maddockdesign.com: hero a pantalla completa, carrusel, fichas con tabla de información y pie con el nombre a todo el ancho.
- Seis inmuebles ficticios marcados como demostración, selección de destacados y filtros combinables.
- Fichas estáticas con galería, descripción, características, navegación y consulta contextual por WhatsApp.
- Sobre Thony con retrato, teléfono, correo, Instagram y WhatsApp (Thony no tiene Facebook).
- Metadatos, imagen Open Graph, estado 404 y exclusión de fichas ficticias de indexación.
- Documentación compartida y pruebas automatizadas.

## Integración sobre Claude — entrega mediante PR

- Base main d0f5f09, rama feat/ramaldi-alberobello-integrated; conserva la composición oscura de Claude.
- Alberobello con cuatro renders y PDF original, renta provisional autorizada y unidad por confirmar; seis demostraciones preservadas.
- Selección Reales, filtros activos, carrusel con etiquetas correctas, teclado/gestos, error/reintento, no JS y contacto móvil contextual.
- Acentos Ramaldi legibles dentro del tema carbón, sin recrear el logo ni reactivar el diseño claro anterior.
- Código, pruebas y activos en 6260099; entrega autorizada mediante PR de esta rama a main, con Preview automática de Vercel. Validación local final de 62 pruebas y capturas en AUDIT-INTEGRATION; resultados remotos en los checks del PR.
- Continuación exclusiva del preloader en a5ae5b8: conserva la composición, suma apertura CSS discreta, espera real acotada y protección de entrada SPA; 72 pruebas locales aprobadas y evidencia actual en PRELOADER. Actualiza el mismo PR #4.

## En desarrollo

- Verificar operaciones autenticadas del panel Supabase con el propietario. El proyecto ya responde a lectura pública; no importar las demostraciones ni crear inventario para llenar el catálogo. Publicar únicamente material real y autorizado.


## Planificadas — Contenido y lanzamiento

- Recibir e incorporar los dos logotipos originales y ajustar colores a sus archivos.
- Incorporar biografía aprobada por Thony (retrato incorporado el 2026-10-18).
- Recibir fotografías autorizadas y datos verificables de propiedades reales.
- Revisar todos los mensajes y datos con el propietario.
- Revisar la Preview del nuevo PR en el proyecto Vercel ya conectado y fusionar a main cuando corresponda publicar; confirmar contenido antes del lanzamiento comercial.
- Completar medición de campo y pruebas Safari/iPhone/Android reales. Primera comparación Lighthouse móvil simulado registrada en CINEMATIC-REVIEW; no sustituye esas comprobaciones.

## Planificada — Representación 3D con IA, fase posterior

Con imágenes autorizadas, evaluar procesamiento, reconstrucción aproximada, optimización, almacenamiento y un visor web. Las fotografías no garantizan precisión arquitectónica: importan cobertura, calidad y tecnología. Mantener clara la procedencia y las limitaciones del modelo.

El tipo `Property` permite una referencia opcional `virtualTour` con `modelUrl`, `format` (`glb`/`gltf`) y `provenance` (`captured`/`ai-generated`). Ninguna ficha incluye modelos ni recorridos todavía. La integración de procesamiento se mantendrá separada del catálogo. No se ha creado una API, motor de IA ni visor falso.

## Ideas pendientes de aprobación

- Gestión avanzada del inventario más allá del panel (estadísticas, flujos de aprobación).
- CRM, cuentas, reservas, chatbot, pagos o aplicación móvil.
- Proveedores de reconstrucción 3D, costes, consentimiento, retención y almacenamiento.

Estas ideas no forman parte de la fase 1 implementada.

# Roadmap

## Terminadas — Fase 1 técnica

- Aplicación Next.js con TypeScript y estructura compartida.
- Dirección editorial, variables de color, fuentes locales y animaciones de interfaz.
- Portada, navegación adaptable, entrada de puerta CSS 3D y movimiento reducido.
- Seis inmuebles ficticios marcados como demostración, selección de destacados y filtros combinables.
- Fichas estáticas con galería, descripción, características, navegación y consulta contextual por WhatsApp.
- Sobre Thony, teléfono, correo, Instagram y Facebook pendiente sin enlace inventado.
- Metadatos, imagen Open Graph, estado 404 y exclusión de fichas ficticias de indexación.
- Documentación compartida y pruebas automatizadas.

## En desarrollo

- Ninguna funcionalidad adicional abierta; las verificaciones de la entrega se registran en HANDOFF y CHANGELOG.

## Implementadas — Fase 2 de experiencia

- Auditoría actual de portada, catálogo y ficha, local y publicada; evidencia y límites en `AUDIT-PHASE-2.md`.
- Hero cinematográfico con fotografía protagonista, dos acciones y movimiento coordinado.
- Profundidad e iluminación de la puerta CSS existente, respetando sesión, salida segura y movimiento reducido.
- Menú móvil animado con foco, fondo inerte y alternativa sin JavaScript.
- Filtros activos removibles y transiciones de catálogo accesibles, con legibilidad y precios mejorados.
- Galería con teclado normal/ampliado, gesto táctil, carga/error/reintento reales y consulta contextual móvil persistente.
- Pruebas de los estados nuevos y de regresión, con resultados en HANDOFF.

## Planificadas — Contenido y lanzamiento

- Recibir e incorporar los dos logotipos originales y ajustar colores a sus archivos.
- Incorporar retrato y biografía aprobados por Thony.
- Recibir fotografías autorizadas y datos verificables de propiedades reales.
- Confirmar URL de Facebook.
- Revisar todos los mensajes y datos con el propietario.
- Revisar la preview de fase 2 y sus checks; el despliegue de la fase 1 ya existe. Confirmar el SHA servido por el alias y autorizar el lanzamiento comercial.
- Medir Lighthouse/Core Web Vitals y probar Safari/iPhone y Android reales antes de publicar.

## Planificada — Representación 3D con IA, fase posterior

Con imágenes autorizadas, evaluar procesamiento, reconstrucción aproximada, optimización, almacenamiento y un visor web. Las fotografías no garantizan precisión arquitectónica: importan cobertura, calidad y tecnología. Mantener clara la procedencia y las limitaciones del modelo.

El tipo `Property` permite una referencia opcional `virtualTour` con `modelUrl`, `format` (`glb`/`gltf`) y `provenance` (`captured`/`ai-generated`). Ninguna ficha incluye modelos ni recorridos todavía. La integración de procesamiento se mantendrá separada del catálogo. No se ha creado una API, motor de IA ni visor falso.

## Ideas pendientes de aprobación

- CMS o panel administrativo, persistencia y gestión del inventario.
- CRM, cuentas, reservas, chatbot, pagos o aplicación móvil.
- Proveedores de reconstrucción 3D, costes, consentimiento, retención y almacenamiento.

Estas ideas no forman parte de las fases 1 y 2 implementadas.

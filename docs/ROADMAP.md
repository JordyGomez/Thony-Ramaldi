# Roadmap

## Terminadas — Fase 1 técnica

- Aplicación Next.js con TypeScript y estructura compartida.
- Dirección editorial, variables de color, fuentes locales y animaciones de interfaz.
- Portada, navegación adaptable, entrada por sesión y movimiento reducido.
- Rediseño minimalista oscuro inspirado en maddockdesign.com: hero a pantalla completa, carrusel, fichas con tabla de información y pie con el nombre a todo el ancho.
- Seis inmuebles ficticios marcados como demostración, selección de destacados y filtros combinables.
- Fichas estáticas con galería, descripción, características, navegación y consulta contextual por WhatsApp.
- Sobre Thony, teléfono, correo, Instagram y Facebook pendiente sin enlace inventado.
- Metadatos, imagen Open Graph, estado 404 y exclusión de fichas ficticias de indexación.
- Documentación compartida y pruebas automatizadas.

## En desarrollo

- Ninguna funcionalidad adicional abierta; las verificaciones de la entrega se registran en HANDOFF y CHANGELOG.

## Planificadas — Contenido y lanzamiento

- Recibir e incorporar los dos logotipos originales y ajustar colores a sus archivos.
- Incorporar retrato y biografía aprobados por Thony.
- Recibir fotografías autorizadas y datos verificables de propiedades reales.
- Confirmar URL de Facebook.
- Revisar todos los mensajes y datos con el propietario.
- Configurar Vercel, revisar Preview Deployment y autorizar el lanzamiento comercial.
- Medir Lighthouse/Core Web Vitals y probar Safari/iPhone y Android reales antes de publicar.

## Planificada — Representación 3D con IA, fase posterior

Con imágenes autorizadas, evaluar procesamiento, reconstrucción aproximada, optimización, almacenamiento y un visor web. Las fotografías no garantizan precisión arquitectónica: importan cobertura, calidad y tecnología. Mantener clara la procedencia y las limitaciones del modelo.

El tipo `Property` permite una referencia opcional `virtualTour` con `modelUrl`, `format` (`glb`/`gltf`) y `provenance` (`captured`/`ai-generated`). Ninguna ficha incluye modelos ni recorridos todavía. La integración de procesamiento se mantendrá separada del catálogo. No se ha creado una API, motor de IA ni visor falso.

## Ideas pendientes de aprobación

- CMS o panel administrativo, persistencia y gestión del inventario.
- CRM, cuentas, reservas, chatbot, pagos o aplicación móvil.
- Proveedores de reconstrucción 3D, costes, consentimiento, retención y almacenamiento.

Estas ideas no forman parte de la fase 1 implementada.

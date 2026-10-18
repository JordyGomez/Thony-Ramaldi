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

## Integración sobre Claude — entrega mediante PR

- Base main d0f5f09, rama feat/ramaldi-alberobello-integrated; conserva la composición oscura de Claude.
- Alberobello con cuatro renders y PDF original, renta provisional autorizada y unidad por confirmar; seis demostraciones preservadas.
- Selección Reales, filtros activos, carrusel con etiquetas correctas, teclado/gestos, error/reintento, no JS y contacto móvil contextual.
- Acentos Ramaldi legibles dentro del tema carbón, sin recrear el logo ni reactivar el diseño claro anterior.
- Código, pruebas y activos en 6260099; entrega autorizada mediante PR de esta rama a main, con Preview automática de Vercel. Validación local final de 62 pruebas y capturas en AUDIT-INTEGRATION; resultados remotos en los checks del PR.
- Continuación exclusiva del preloader en a5ae5b8: conserva la composición, suma apertura CSS discreta, espera real acotada y protección de entrada SPA; 72 pruebas locales aprobadas y evidencia actual en PRELOADER. Actualiza el mismo PR #4.

## En desarrollo

- Panel de propiedades propio en `/admin` con Supabase: construido y probado sin conexión; pendiente de crear el proyecto, ejecutar `supabase/schema.sql`, crear el usuario de Thony, definir las variables en Vercel e importar las siete fichas actuales.


## Planificadas — Contenido y lanzamiento

- Recibir e incorporar los dos logotipos originales y ajustar colores a sus archivos.
- Incorporar retrato y biografía aprobados por Thony.
- Recibir fotografías autorizadas y datos verificables de propiedades reales.
- Confirmar URL de Facebook.
- Revisar todos los mensajes y datos con el propietario.
- Revisar la Preview del nuevo PR en el proyecto Vercel ya conectado y fusionar a main cuando corresponda publicar; confirmar contenido antes del lanzamiento comercial.
- Medir Lighthouse/Core Web Vitals y probar Safari/iPhone y Android reales antes de publicar.

## Planificada — Representación 3D con IA, fase posterior

Con imágenes autorizadas, evaluar procesamiento, reconstrucción aproximada, optimización, almacenamiento y un visor web. Las fotografías no garantizan precisión arquitectónica: importan cobertura, calidad y tecnología. Mantener clara la procedencia y las limitaciones del modelo.

El tipo `Property` permite una referencia opcional `virtualTour` con `modelUrl`, `format` (`glb`/`gltf`) y `provenance` (`captured`/`ai-generated`). Ninguna ficha incluye modelos ni recorridos todavía. La integración de procesamiento se mantendrá separada del catálogo. No se ha creado una API, motor de IA ni visor falso.

## Ideas pendientes de aprobación

- Gestión avanzada del inventario más allá del panel (estadísticas, flujos de aprobación).
- CRM, cuentas, reservas, chatbot, pagos o aplicación móvil.
- Proveedores de reconstrucción 3D, costes, consentimiento, retención y almacenamiento.

Estas ideas no forman parte de la fase 1 implementada.

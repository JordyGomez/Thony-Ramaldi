# Roadmap

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

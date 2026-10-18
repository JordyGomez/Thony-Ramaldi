# Incorporar Alberobello y mejoras de interacción sobre el diseño oscuro

El catálogo del diseño oscuro contenía solo seis demostraciones y trataba todos los registros como ficticios. Esta entrega incorpora un alquiler real en preparación de Alberobello, con bloque destacado, cuatro renders del folleto, descarga del PDF y consulta contextual. Conserva Inter, fondo carbón, portada, carrusel, menú completo, galerías grandes y pie existentes; Ramaldi aparece mediante acentos de marca.

Se añaden selección Reales, filtros activos retirables, conteos derivados, foco y salidas accesibles, teclado/gestos en galería, carga/error/reintento y alternativas sin JavaScript. El carrusel distingue el alquiler de las demostraciones. El contacto móvil reserva espacio para no tapar el pie.

La introducción tipográfica conserva su composición y añade un marco con apertura CSS discreta. Aparece solo al abrir inicialmente la home y una vez por sesión; llegar por SPA desde una ficha no la activa. La secuencia normal dura 2,3 s y espera el hero/fuentes si se retrasan mediante una respiración de línea, con límite absoluto de 5 s y salida por interacción. Mantiene movimiento reducido, no JS y memoria sin storage; queda preparada para site.logo sin inventar el archivo pendiente.

**US$1,000/mes es un importe provisional de maqueta autorizado; no es una renta confirmada.** Los datos desconocidos de la unidad se muestran Por confirmar, las tipologías se atribuyen al proyecto y los renders no se presentan como fotografías actuales. La ficha permanece noindex y excluida del sitemap. Antes de un lanzamiento comercial se deben confirmar renta, unidad, condiciones y fotografías actuales.

Validación local: dependencias del lockfile existente, lint, tipos y build aprobados; 72 pruebas de Chromium en escritorio y móvil. Incluye las seis demostraciones preservadas, filtros, carrusel, teclado, movimiento reducido, no JS, errores de imagen, WhatsApp, PDF original verificado por hash, axe y responsive, más carga lenta, error, límite de seguridad y navegación SPA del preloader. No equivale a validación de Safari, dispositivos físicos o Web Vitals de campo.

Capturas de integración en docs/AUDIT-INTEGRATION.md y revisión actual del preloader en docs/PRELOADER.md. No se añaden dependencias respecto al main del diseño oscuro, backend, mapas ni motor 3D.

La rama parte directamente de main `d0f5f09` (PR #3 de Claude). El PR #2 de la fase anterior no contiene esta integración. Vercel ya está conectado al repositorio: este PR genera una Preview y fusionarlo a main actualiza https://thony-ramaldi.vercel.app/. Guardar/publicar la configuración del entorno Codex no fusiona el PR. No se realiza una fusión automática.

# Incorporar Alberobello y mejoras de interacción sobre el diseño oscuro

El catálogo del diseño oscuro contenía solo seis demostraciones y trataba todos los registros como ficticios. Esta entrega incorpora un alquiler real en preparación de Alberobello, con bloque destacado, cuatro renders del folleto, descarga del PDF y consulta contextual. Conserva Inter, fondo carbón, portada, carrusel, menú completo, galerías grandes y pie existentes; Ramaldi aparece mediante acentos de marca.

Se añaden selección Reales, filtros activos retirables, conteos derivados, foco y salidas accesibles, teclado/gestos en galería, carga/error/reintento y alternativas sin JavaScript. El carrusel distingue el alquiler de las demostraciones. El contacto móvil reserva espacio para no tapar el pie.

**US$1,000/mes es un importe provisional de maqueta autorizado; no es una renta confirmada.** Los datos desconocidos de la unidad se muestran Por confirmar, las tipologías se atribuyen al proyecto y los renders no se presentan como fotografías actuales. La ficha permanece noindex y excluida del sitemap. Antes de un lanzamiento comercial se deben confirmar renta, unidad, condiciones y fotografías actuales.

Validación local: npm ci con lockfile, lint, tipos y build aprobados; 62 pruebas de Chromium en escritorio y móvil. Incluye las seis demostraciones preservadas, filtros, carrusel, teclado, movimiento reducido, no JS, errores de imagen, WhatsApp, PDF original verificado por hash, axe y responsive. No equivale a validación de Safari, dispositivos físicos o Web Vitals de campo.

Capturas actuales en docs/AUDIT-INTEGRATION.md. No se añaden dependencias respecto al main del diseño oscuro, backend, mapas ni motor 3D.

La rama parte directamente de main `d0f5f09` (PR #3 de Claude). El PR #2 de la fase anterior no contiene esta integración. Vercel ya está conectado al repositorio: este PR genera una Preview y fusionarlo a main actualiza https://thony-ramaldi.vercel.app/. Guardar/publicar la configuración del entorno Codex no fusiona el PR. No se realiza una fusión automática.

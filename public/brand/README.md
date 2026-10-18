# Referencias de Ramaldi y archivos de marca

El propietario compartió dos referencias visuales del logo Ramaldi en la conversación. Se usaron para ajustar la paleta, documentada en `docs/BRAND.md`. Este directorio todavía no contiene sus archivos originales reutilizables. El símbolo no se ha redibujado ni generado; el encabezado conserva la identidad tipográfica.

El flujo actual es `/admin/web` → **Imágenes y logo** → **Logo original**. Subir PNG o WebP con transparencia, revisar en escritorio y móvil, guardar borrador y publicar. Esa selección alimenta encabezado e introducción; la versión para fondo oscuro debe tener contraste. El retrato, portada, pie e imagen social se gestionan en ese mismo apartado. No se inventa el símbolo de Ramaldi.

Para incorporar un original en el código como recurso por defecto:

1. Conservar archivos originales autorizados (SVG preferido, o PNG transparente).
2. Añadirlos a este directorio con nombres claros.
3. Incorporar su ruta en `defaultSettings.assets` de `src/lib/site-settings.ts` y permitir ese recurso autorizado en la validación de imágenes. La configuración publicada del panel tiene prioridad sobre los valores por defecto.
4. Comprobar que el nombre de Thony sigue visible, que la imagen no se deforma y que el contraste es correcto.
5. Para otro retrato por defecto, añadir el archivo autorizado a `public/images/` y actualizar `defaultSettings.assets.portrait` y `siteImage`.

El monograma de la pestaña y el texto del encabezado son recursos tipográficos provisionales, no logotipos de Ramaldi.

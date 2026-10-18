# Diseño de Claude, movimiento 3D y administración de la web

2026-10-18 · Codex / Yordi Gómez. Base remota revisada: main `3adaf47`, que ya contiene los PR #5 y #6. Implementación: **f164bd3**, rama `feat/claude-design-full-admin`. El propietario pidió expresamente restaurar la composición de Claude, añadir novedades y 3D sobre ella, corregir las subidas y gestionar el contenido desde el panel. También autorizó integrar a main al terminar las comprobaciones.

## Composición y experiencia

Se recuperan fotografía de portada `portada.jpg`, Inter, carbón, estructura de secciones, carrusel y pie fotográfico de main `0742704`. La portada solicita una imagen más adecuada al recorte vertical móvil: las capturas cargaron una anchura natural de 1920 px en escritorio y 1620 px en móvil, sin desbordamiento. Se mantienen los avisos y créditos de las fotografías ilustrativas. El retrato oficial sigue en presentación e introducción; no se inventan personas, viviendas ni logotipos.

Un controlador por página aplica profundidad a portada, fotografías, tarjetas, galería y pie, por eventos y mientras las superficies están visibles. Se incorporan revelados con perspectiva, entrada del menú en planos, controles y filas con profundidad. Se conserva la maqueta. No hay WebGL ni nuevo motor 3D. El movimiento se ajusta desde el panel; se respetan movimiento reducido, visibilidad de pestaña, ahorro de datos y dispositivos con memoria declarada limitada. Las pruebas comprueban que la transformación cambia al mover el cursor, además de desactivarse fuera de pantalla o con movimiento reducido.

«Mi próximo espacio» reúne intención, zona, presupuesto y plazo en una secuencia de tarjetas. Solo sugiere fichas reales de los datos recibidos y respeta importes provisionales. Construye un mensaje para WhatsApp; el visitante decide abrirlo y enviarlo. No se crea inventario ni se promete disponibilidad. La experiencia se puede editar, ocultar y reordenar.

## Administración y archivos

- Propiedades: se conserva el formulario y el modelo de Claude, con imágenes ordenables, descripciones, folleto y publicación. El listado distingue lo realmente público de las demostraciones y comprueba el rol antes de ofrecer administración.
- Mi página web: identidad, contactos, menú, textos de portada/presentación/catálogo/búsqueda/contacto/pie, pasos, SEO y redes. Selección de portada, retrato, pie, logo e imagen social. Paleta con contraste mínimo, intensidad de movimiento, introducción, contacto flotante, indexación, secciones y orden.
- Archivos: biblioteca de fotos y PDF, subida con progreso, reutilización y reintento. Los archivos `media/` se conservan al borrar una ficha porque se comparten con otras partes del sitio. El almacén `properties` continúa siendo público; los borradores de configuración y su historial tienen acceso privado.
- Configuración: diagnóstico de sesión, rol, lectura de archivos y tablas del editor; descarga del SQL de activación.

Antes, cualquier excepción de subida se convertía en «Revisa tu conexión». Ahora el navegador envía a `/api/admin/media` del mismo origen; el servidor verifica usuario con Auth, rol por `is_admin`, origen, límite y bytes del archivo. La comprobación de origen usa el Host recibido, para funcionar detrás del servidor interno de Next/Vercel. Se distinguen cuenta sin permisos, sesión vencida, bucket ausente, formato, tamaño y fallo de servicio. La foto se reduce a 2400 px y hasta 3 MB; PNG conserva transparencia. Hay alternativa a `createImageBitmap`, cierre del bitmap/URL temporal y cancelación al salir del formulario. HEIC se debe exportar a JPG. El folleto admite PDF de hasta 3 MB.

## Borradores, publicación y activación

`getSiteSettings()` lee `site_content` con el cliente anónimo y la misma política de conservación ante errores que el catálogo. Una tabla aún no instalada utiliza los valores originales de Claude. `site_drafts` y `site_revisions` quedan separados y privados, con RLS. La publicación no necesita otro despliegue de código.

La RPC `save_site_content` comprueba usuario/rol, bloquea los registros y exige la revisión esperada. Guardar borrador conserva la publicación. Publicar archiva la versión anterior, actualiza publicación y revisión dentro de una transacción y regenera el sitio. El panel permite descargar la edición local y cargar una versión anterior para revisarla; un conflicto no sobrescribe la edición de otro colaborador. La vista previa está protegida y recibe cambios solo de su ventana padre y origen verificados. Los campos se validan en el servidor y se renderizan como texto; no se interpretan HTML/CSS ni scripts y se restringen los destinos de las imágenes.

**Acción externa necesaria:** ejecutar una vez `supabase/migrations/20261018_site_editor.sql` en SQL Editor del proyecto existente. La migración es aditiva e idempotente; conserva propiedades, usuarios y archivos y comprueba las políticas de almacenamiento. No concede roles a nuevos correos. El propietario del proyecto debe tener autorizado en `admin_users` el correo con el que administra la web.

En la comprobación anónima del proyecto real se observaron `properties` HTTP 200, cero filas, y las nuevas tablas HTTP 404 / `PGRST205`. No se ejecutó la migración ni se hizo login o escritura en el Supabase real desde esta sesión. El acceso público del proyecto permite comprobar lectura, pero no ejecutar DDL. Hasta activar las tablas, el editor informa de ello y deshabilita guardar/publicar; la web y las propiedades existentes siguen funcionando. No confundir una prueba local con la activación de producción.

## Validación

- `npm ci` con lockfile: **402 paquetes**, con caché permitida. Una sola dependencia nueva, **PGlite 0.5.10**, exclusiva de desarrollo.
- Lint, generación de tipos y TypeScript: aprobados. Se ignora el reporte generado del panel igual que el reporte anterior, sin excluir código de aplicación.
- Build y suite con fixtures aisladas: **84 aprobadas**, incluidas las 82 regresiones anteriores y dos ejecuciones de búsqueda personal; ninguna omitida o fallida.
- Otro build sin fixtures y suite pública: **6 aprobadas**, escritorio y móvil; catálogo vacío, sin anuncios de prueba y panel separado.
- Build normal con la configuración pública real de Supabase: aprobado, sin fichas generadas al estar vacío el inventario. No requirió crear datos ni activar el editor para compilar la web existente.
- SQL real con PostgreSQL embebido: **9 aprobadas**, incluyendo instalación repetida, RLS, lectura pública, rol, borrador, publicación, historial y revisión desactualizada.
- Panel con doble HTTP de Auth, PostgREST y Storage en loopback: **12 aprobadas**. Cookies/login, rutas sin sesión, subida/reintento, sesión vencida, rol, bytes/origen, diagnóstico, móvil/axe, borrador, previsualización, conflicto, publicación de contenido/SEO/contactos/secciones/movimiento, recuperación, validación y conservación de archivos compartidos al borrar una ficha.

**111 comprobaciones aprobadas en total.** El doble solo se activa fuera de Vercel y nunca usa el proyecto real. La protección de Next contra IP privadas del optimizador se conserva: solo las miniaturas del doble local se sustituyen por el JPEG conocido en esas pruebas; las suites públicas cargan imágenes por la vía normal. La migración descargable se confirmó incluida en el bundle del servidor, sin PGlite en ese bundle.

Las capturas locales en `audit/claude-cms` muestran portada escritorio/móvil, búsqueda y editor escritorio/móvil. Las del panel corresponden a la cuenta ficticia reservada de pruebas, no a una sesión del propietario. Las imágenes no prueban autenticación o escrituras reales en producción. No se afirman pruebas en Safari, teléfonos físicos, mediciones de campo o un nuevo resultado Lighthouse; el informe anterior pertenece a otra composición.

| Escena | Escritorio | Móvil |
| --- | --- | --- |
| Portada de Claude | [Portada](audit/claude-cms/hero-desktop.png) | [Portada](audit/claude-cms/hero-mobile.png) |
| Profundidad al cursor | [Perspectiva](audit/claude-cms/depth-desktop.png) | Alternativa por desplazamiento y preferencia de movimiento |
| Búsqueda personal | [Consulta preparada](audit/claude-cms/search-desktop.png) | Comprobada por la suite pública con fixtures |
| Editor privado de prueba | [Escritorio](audit/claude-cms/editor-desktop.png) | [Móvil](audit/claude-cms/editor-mobile.png) |

## Entrega

La rama se publica mediante PR contra main, revisando otra vez el remoto y los checks. La autorización del propietario incluye fusionarla y verificar el despliegue automático del proyecto Vercel existente. El estado remoto y la ejecución de la migración deben comprobarse al retomar; no inferirlos de este informe.

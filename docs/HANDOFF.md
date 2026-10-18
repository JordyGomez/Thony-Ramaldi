# Transferencia de contexto

## Corrección vigente — foto del pie, 2026-10-18

El PR #7 quedó fusionado en main `6ef6e98`, con 111 pruebas de main aprobadas y Vercel publicado. El propietario mostró una captura del pie y pidió quitar la foto ilustrativa de baja calidad y esperar propiedades de los administradores. Rama `fix/footer-real-property-photo`, sobre ese main sin avances remotos ni cambios locales ajenos.

El pie omite el bloque completo de imagen mientras no haya una propiedad pública no demo con fotografías; también se excluyen renders. Selección compartida en `src/lib/footer-property-image.ts`, usada por el layout público y la preview. Solo se pasa esa imagen al cliente, reutilizando la lectura pública cacheada. La primera foto incluye su alt y el título de la propiedad. La selección propia del editor queda opcional y requiere inventario; `villa.jpg` se ignora incluso en configuraciones anteriores. Firma, contactos, portada y movimiento se conservan; no se elimina el archivo de fixtures ni se crea contenido en Supabase.

La activación del CMS sigue pendiente del administrador de Supabase: el usuario indicó que no tiene acceso al proyecto. Esta corrección del pie funciona sin instalar esa migración. La prueba de publicación/borrado del panel ahora comprueba también ausencia inicial, aparición de la foto publicada y retirada posterior, conservando los archivos compartidos. Consultar los checks del PR de esta rama para los resultados de la entrega.

Verificación local de esta corrección: lint, tipos y builds sin fixtures y con configuración pública real aprobados; **6 pruebas públicas y 12 de panel aprobadas**, incluyendo el ciclo del pie, con servicios locales de prueba. Los checks de GitHub/Vercel se comprueban al integrar. No se creó inventario en producción ni se ejecutó la migración pendiente.

## Estado vigente — diseño de Claude + 3D + editor, 2026-10-18

El usuario rechazó la portada arquitectónica del PR #6 y pidió la composición de Claude con animaciones y novedades, corregir el error de fotos y controlar el contenido desde el panel. **Autorizó explícitamente llevar esta entrega a main al terminar**. Base revisada: main `3adaf47`; implementación **f164bd3** en `feat/claude-design-full-admin`. Se conserva el checkout; no se crea worktree ni se aplica la antigua rama del PR #2.

Se recuperan portada `portada.jpg`, Inter/carbón, estructura y pie fotográfico de `0742704`. El 3D se aplica a capas de imagen, revelados, menú, tarjetas, galería, controles y búsqueda personal. Se mantiene el retrato oficial, los avisos ilustrativos, la sesión/espera del preloader, a11y y las alternativas de movimiento. No se debe volver a reemplazar la portada de Claude por geometría/retrato. El panel ya permite incorporar un logo original sin editar código.

`getSiteSettings()` lee solo `site_content`. Defaults, tipos y validación: `src/lib/site-settings.ts`; contexto cliente: `useSite`. Edición `/admin/web`, biblioteca `/admin/archivos`, diagnóstico `/admin/configuracion`, preview privada `/admin/vista-previa`. Los borradores (`site_drafts`) y el historial (`site_revisions`) son privados; RPC con revisión/locks, publicación atómica y revalidación. No introducir HTML/CSS ejecutable ni lecturas públicas de borradores.

Fotos: `/api/admin/media`, cookies verificadas en servidor, `is_admin`, origen por Host, tamaño/firma, progreso y reintento. Diferenciar permisos de conexión. Fotos hasta 2400 px y 3 MB, PNG transparente y PDF hasta 3 MB; HEIC se exporta a JPG. Los archivos `media/` se comparten y no se borran al eliminar una propiedad. Las políticas de almacenamiento y las nuevas tablas se preparan en la migración aditiva `supabase/migrations/20261018_site_editor.sql`.

**Prerrequisito externo real:** la migración todavía debe ejecutarse en SQL Editor del proyecto existente. La lectura anónima encontró `properties` 200/0 filas y tablas nuevas 404/PGRST205. La sesión dispone de lectura pública; no de DDL ni de una sesión real de administración. El editor informa de la activación y no simula guardar. No se crearon cuentas, roles, publicaciones o archivos en el proyecto real. La carga nueva puede usar el bucket/políticas anteriores; el diagnóstico explica cualquier permiso pendiente de la cuenta.

Validación: npm ci, lint, tipos y builds; **84 regresiones + 6 públicas + 12 de panel + 9 PostgreSQL embebido: 111 aprobadas**, sin omitidas ni fallidas. El panel usa un doble HTTP exclusivamente en loopback; su flag se bloquea con VERCEL_ENV. La suite recompila .next: volver a compilar para el modo que se vaya a ejecutar. PGlite es solo de desarrollo, sin motor/DB nueva en producción. Ver `docs/CLAUDE-ADMIN-REVIEW.md`, capturas y README. No se afirman operaciones reales autenticadas, Safari o rendimiento de campo.

La entrega prepara PR, comprueba sus checks, integra a main por autorización del usuario y verifica el Vercel existente. Consultar GitHub para el estado remoto final y repetir la lectura de tablas antes de afirmar activación. Los registros siguientes describen entregas anteriores.


## Estado actual — evolución cinematográfica, 2026-10-18 (Codex / Yordi Gómez)

Nueva rama `feat/cinematic-ramaldi-experience` desde main **0742704**, merge del PR #5 de Claude. Implementación: **7ce368a**. PR #4 y #5 ya estaban fusionados al empezar. Se revisaron ambos, sus assets y arquitectura antes de editar; no se aplica la antigua rama de fase 2. El nuevo brief autoriza ampliar la capa visual completa preservando el trabajo de Claude.

Se implementan puerta sólida en CSS con marco/espesor/tirador, retrato oficial y presentación tipográfica preparada para site.logo; 2,1 s normales, una vez por sesión, solo entrada inicial por home, espera crítica acotada a 5 s y todas las salidas seguras anteriores. La escena está memoizada; enlaza su salida con hero y cabecera. Hero y pie utilizan arquitectura de marca en lugar de viviendas ilustrativas, conservando ficheros y créditos de las fotos anteriores. No se generan personas ni imágenes de inmuebles.

`cinematic.css` solo se importa en el layout público. Profundidad por puntero/scroll en dispositivos elegibles, fuera de viewport inactiva y sin bucle de frames; fallback estático en móvil, ahorro de datos, poca memoria declarada y movimiento reducido. Menú escalonado con su control de foco intacto, revelados diferenciados, retrato editorial, tarjetas y contacto refinados.

La lectura pública real de Supabase respondió 200 con cero publicaciones. Catálogo vacío con contacto; el servicio solo lee publicadas no demo. Si se desactiva Supabase, ya no hay ejemplos automáticos: requieren THONY_TEST_FIXTURES=1 al compilar y ejecutar, sin VERCEL_ENV. CI valida una compilación de regresiones y otra pública sin fixtures. Ninguna prueba crea datos en Supabase.

Panel, proxy, Auth, acciones, archivos, esquema/RLS, mapping de propiedades y dependencias preservados sin cambios. Se comprobó redirección anónima /admin → /admin/login con configuración real y su aspecto aislado; no se hicieron operaciones autenticadas ni escrituras. Facebook continúa eliminado. El retrato sí está disponible; las imágenes de logo del chat siguen sin fichero local reutilizable. site.logo y el plano interior admiten futuros recursos autorizados, sin reconstruir la marca.

Lint, tipos y builds aprobados; **82 regresiones y 6 comprobaciones públicas sin fixtures aprobadas, ninguna omitida ni fallida**. Revisión y capturas en [CINEMATIC-REVIEW](CINEMATIC-REVIEW.md). Lighthouse móvil simulado: performance 92/100, accesibilidad automática 100/100, LCP 3,125 s, TBT 67 ms y CLS 0; no equivale a validación de dispositivos físicos o campo. Una regresión intermedia de TBT se detectó, optimizó y conserva en el informe. Revisar los checks del nuevo PR antes de fusionar; esta tarea no fusiona producción.

## Registro anterior — panel de propiedades con Supabase, 2026-10-18 (Claude / Yordi Lewis)

**Retrato y Facebook (2026-10-18):** retrato oficial incorporado (`site.portrait`); Thony no tiene Facebook y se eliminó de la web. Pendientes de contenido: logo reutilizable, biografía, datos definitivos de Alberobello y propiedades reales.

**Actualización:** por petición del usuario la web pública muestra solo las fichas publicadas en el panel (sin respaldo local con Supabase activo; ver CHANGELOG). Proyecto Supabase: `uowylfdlirlfqksvdeer`, configurado por defecto en `src/lib/supabase/env.ts`. El usuario ejecutó `supabase/schema.sql` sin cambiar el correo de ejemplo; se le indicó reemplazarlo por `yordilewis@gmail.com` en `admin_users` y crear ese usuario en Auth. Al fusionar el PR #5, la web principal quedará sin propiedades hasta que se importe Alberobello o se publiquen fichas: conviene hacerlo en la preview antes de fusionar.

Rama `claude/modest-ramanujan-526yik`, creada desde main `dfdeb8e` (merge del PR #4 de Codex), PR #5. Panel propio en `/admin` apuntando al proyecto `uowylfdlirlfqksvdeer`, **sin probar contra él desde este entorno**: la red cloud no tiene permitidos los dominios de Supabase. Con las variables vacías (CI) la web usa los datos de ejemplo. Sanity se probó y se descartó por decisión del usuario.

Siguiente paso al activarlo (detalle en README, sección del panel): crear el proyecto, ejecutar `supabase/schema.sql` con el correo de Thony, crear su usuario y desactivar registros, definir `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (el proyecto de Vercel es del equipo `los-yordis`; alternativa: valores por defecto en `src/lib/supabase/env.ts`, son públicos), desplegar e **importar las propiedades actuales** desde el panel vacío antes de crear fichas nuevas. Verificar entonces login, subida de fotos, guardado, borrado e importación, que no se pudieron probar contra un proyecto real. Para probar desde la nube hay que permitir `*.supabase.co` en la red del entorno.

Decisiones: tres estados de ficha (`listingStatus` en `src/data/properties.ts`) para que una propiedad nueva no herede los textos de Alberobello; el bloque destacado de Alberobello se busca por slug. Las fichas siguen con `noindex` y fuera del sitemap: revisar esa política cuando haya inventario real disponible. Los archivos de fotos quitadas en el formulario antes de guardar quedan en el bucket; al borrar una ficha sí se eliminan sus archivos.

---


## Estado actual — mejora exclusiva del preloader, 2026-10-18

El usuario aportó un texto de preloader y pidió descartar cualquier instrucción que reemplazara lo ya construido. Se revisaron GitHub, el PR #4 y el código: no había cambios remotos nuevos de main ni modificaciones locales desconocidas. La continuación parte de c3e256e en la misma rama `feat/ramaldi-alberobello-integrated`, conservando íntegros Alberobello, catálogo y diseño de Claude. Implementación: **a5ae5b8**.

Únicos cambios de aplicación: preloader.tsx y su bloque en globals.css. Se mantiene la entrada tipográfica y se añade un marco con apertura CSS de fondo, en vez de sustituir la composición. No se instala nada. `site.logo` está preparado, pero sigue faltando el archivo real; se conserva el texto original y se recupera si falla una imagen de logo futura.

Entrada inicial por home y una vez por sesión; se evita también la primera llegada SPA a la home desde una ficha. Duración normal 2,3 s; espera del hero decodificado y fuentes con respiración de línea si se retrasan, sin repetir la puerta. Límite absoluto 5 s, salida por interacción/ocultar pestaña/movimiento reducido, fallback CSS y ningún overlay sin JS. No se espera el resto de imágenes lazy. Mantener la regla existente de no repetir al refrescar durante la misma sesión.

Lint, tipos, build y **72 pruebas locales aprobadas, 0 omitidas, 0 fallidas** en Chromium escritorio/móvil. Diez ejecuciones nuevas en tests/preloader.spec.ts y todas las regresiones anteriores conservadas. Capturas antes/después y decisiones en [PRELOADER.md](PRELOADER.md). No se afirma validación de Safari, equipos físicos o rendimiento de campo. Esta entrega actualiza el PR #4 y su preview; comprobar los checks del nuevo commit antes de fusionar. No se fusiona main automáticamente. Las rutas temporales de respaldos citadas en entradas anteriores pertenecen a su instancia original: comprobar su existencia antes de usarlas.

## Entrega anterior — integración sobre Claude, 2026-10-18

El usuario pidió conservar el diseño de Claude y añadir nuestras mejoras; después autorizó expresamente guardar, subir y crear un PR para Vercel. La base de esta rama es **main `d0f5f093d018bff6f4ac284d5fab64a4a5d3a1bb`**, merge del PR #3 de Claude. Rama de entrega: **`feat/ramaldi-alberobello-integrated`**, creada en el mismo checkout, sin otro repositorio o worktree. Código, pruebas y activos: commit **`6260099`**. La documentación posterior registra la entrega mediante PR contra main y su flujo de despliegue.

### Conservado y añadido

Se mantienen fondo carbón, Inter variable, hero a pantalla completa, introducción centrada, carrusel nativo, menú completo en todos los tamaños, galerías inmersivas, tabla de ficha y pie de Claude. Su AGENTS, package.json/lockfile, icono, páginas de error y Open Graph no se sustituyen. La puerta CSS del borrador anterior no se reactiva: el usuario eligió conservar el diseño de Claude y su introducción tipográfica.

Se añaden bloque Alberobello, ficha real en preparación, cuatro renders extraídos del PDF, folleto original, datos desconocidos como null/Por confirmar y US$1,000/mes provisional autorizado. No es una renta confirmada; el PDF no indica precio ni identifica la unidad. Ficha noindex y fuera del sitemap. El carrusel ya no llama Demostración a todos los registros; seis demostraciones y sus rutas permanecen.

Se portan filtros activos y selección Reales, conteos derivados, exclusión del importe provisional del presupuesto, salidas inaccesibles, foco, galería normal/ampliada con teclado, gestos y recuperación de errores, contenido sin JS y CTA móvil contextual con reserva al pie. Los acentos de Ramaldi se adaptan al tema oscuro, con texto legible de al menos 12 px. El símbolo del logo no se redibuja; falta archivo reutilizable y retrato.

### Comprobaciones y publicación

Validación final: npm ci, lint, tipos y build aprobados; 62 pruebas aprobadas, 0 omitidas y 0 fallidas, sobre la compilación final. Se instalaron las dependencias del lockfile de Claude mediante npm ci con caché en /workspace/.cache/npm. Revisar AUDIT-INTEGRATION.md para capturas actuales y límites. No atribuir a esta integración los informes históricos de la versión clara ni los resultados antiguos de los PR.

La rama anterior feat/thony-phase-two y su PR #2 siguen separados; ese PR conserva sus conflictos con main. La integración actual parte directamente del nuevo main, evitando aplicar la combinación conflictiva antigua. Se volvió a consultar el remoto antes de los commits: main continúa en d0f5f09. Consultar el PR asociado a feat/ramaldi-alberobello-integrated para los resultados remotos de Calidad y Vercel; no usar el PR #2 para publicar estos cambios.

El proyecto de Vercel ya está conectado al repositorio: los pushes de esta rama generan Preview y la fusión a main genera producción en https://thony-ramaldi.vercel.app/. README documenta los pasos. Guardar/publicar la configuración del entorno Codex no fusiona el PR. Esta entrega no fusiona main; la revisión y publicación de producción quedan en GitHub. Los resultados locales anteriores no sustituyen los checks del nuevo PR.

El borrador previo está protegido en el stash “safety: preserve local Alberobello before Claude integration” y en /tmp/thony-integration-safety/before-integration.tar.gz. No aplicar ese stash sobre esta rama sin comparar, porque contiene el diseño claro anterior. Su memoria íntegra se conserva en docs/archive/HANDOFF-before-Claude-integration.md. No se eliminan esos respaldos durante esta tarea.

Pendientes comerciales: confirmar unidad, precio/moneda, mantenimiento, parqueos, mobiliario, disponibilidad y condiciones; recibir fotos actuales. Facebook y retrato siguen pendientes. No se enviaron mensajes ni se añadieron backend, mapas o motor 3D.

---

## Registro conservado de Claude y fase 1

## Actualización 2026-10-18 — Claude / Yordi Lewis: rediseño minimalista oscuro

Estado: `main` (con la fase 1 fusionada mediante el PR #1) está desplegado en Vercel en https://thony-ramaldi.vercel.app; el proyecto de Vercel pertenece a otro equipo (`los-yordis`) según el bot de Vercel en el PR #1. Los cambios que llegan a `main` se publican allí; las ramas generan vistas previas.

Rama de trabajo: `claude/modest-ramanujan-526yik`, creada desde `origin/main` (`106e9ce`). Rediseño completo inspirado en maddockdesign.com a petición de Yordi Lewis: tema carbón, Inter variable como única familia, hero a pantalla completa, carrusel `src/components/showcase.tsx`, ficha con galería a pantalla completa y tabla de información, menú a pantalla completa en todos los tamaños y pie con el nombre a todo el ancho. Detalle, archivos y validación en CHANGELOG.

Decisiones: se conservan filtros del catálogo y el botón flotante de WhatsApp (la referencia es un estudio de diseño; aquí la conversión importa). Las fotografías ilustrativas actuales son el punto débil de este estilo: la calidad de las fotos reales es ahora prioritaria. El nombre del pie usa `font-size: calc((100vw - 2 * var(--gutter)) / 7.72)` calibrado para "THONY PAULINO" en Inter 500; si cambia el texto o el tracking, recalibrar midiendo el ancho del texto.

Entorno: Chromium preinstalado en `/opt/pw-browsers/chromium-1194`; para `npm test` en esta nube se usó una configuración temporal fuera del repositorio que solo cambia `executablePath`. La red del entorno necesita `maddockdesign.com` y `www.datocms-assets.com` para volver a revisar la referencia.

Pendiente: revisar la vista previa de Vercel del PR, logos y retrato originales, inventario y fotografías reales, enlace de Facebook, medición de rendimiento y dispositivos reales.

---

## Estado al 2026-10-18

Fase 1 técnica implementada por **Codex**, en la sesión de **Yordi Gómez** según el brief proporcionado. No se han observado cambios atribuibles a Claude o Yordi Lewis. El único commit remoto encontrado y revisado al inicio y durante la tarea fue `6032a98216c0c841b56b8b1ab5c725441a65cbb8` (`Initial commit`, autor Git: JordyGomez). Ese autor por sí solo no demuestra el uso de un asistente.

Rama de trabajo: `feat/thony-phase-one`, publicada en el remoto oficial. Commit inicial de implementación: `d6247bf` (`feat: implement Thony Paulino real estate phase one`); corrección de invalidación de imágenes y generación de tipos: `43f5b1a`. Ambos se publicaron sin conflictos ni fusión a main. Consultar `git log -1` para incluir actualizaciones documentales posteriores y comparar con el remoto al iniciar la siguiente tarea. La API de GitHub está bloqueada para crear el PR; `docs/PULL_REQUEST.md` contiene su descripción preparada.

## Funcionalidades completadas

Portada editorial, navegación sticky y móvil, puerta CSS de 2,3 s por sesión, movimiento reducido, seis propiedades ficticias, destacados, cinco filtros combinables, estado vacío, seis fichas estáticas, galerías ampliables con teclado, contacto real y consultas contextuales por WhatsApp. Diseño probado sin desbordamiento a 360, 390, 768, 844 y 1440 px. Contenido de portada disponible sin JavaScript.

No hay backend, base de datos, autenticación, mapas ni recorridos virtuales. `Property.virtualTour` es solo una extensión tipada para referencias futuras, nunca se presenta como una funcionalidad activa.

## Archivos y decisiones

- `src/app/`: páginas, layout, CSS, metadatos, Open Graph, errores, robots y sitemap.
- `src/components/`: catálogo, tarjetas, menú, galería, introducción y revelados.
- `src/data/properties.ts`: inventario ficticio tipado, filtrado y formato de precios USD.
- `src/lib/site.ts`: datos oficiales públicos, URL del sitio, Facebook opcional y codificación de WhatsApp.
- `public/images/`, `public/brand/README.md`, `docs/ASSETS.md`: referencias visuales y recursos originales pendientes.
- `tests/site.spec.ts`, `playwright.config.ts`: verificación de Chromium en escritorio y móvil y axe.
- `.github/workflows/ci.yml`: definición de CI; no equivale a una ejecución remota verificada.
- `README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/CHANGELOG.md`, `docs/ROADMAP.md`: memoria común sin archivos exclusivos por asistente.

Server Components por defecto; interacción en componentes cliente. No se instaló GSAP ni Three.js. Fotografías y fuentes locales evitan dependencias externas al cargar la aplicación. Los datos de demostración son explícitos en tarjetas, fichas, galerías y WhatsApp; las fichas llevan `noindex` y quedan fuera del sitemap.

Al ejecutar `next dev`, Next.js 16.4.2 añadió su bloque `nextjs-agent-rules` a AGENTS.md sin sustituir nuestras reglas. Se conserva el bloque: revisar la guía relevante de `node_modules/next/dist/docs/` antes de cambiar código de Next.

## Dependencias

Node 24.19.0 y npm 11.9.0 usados en esta máquina. Next 16.4.2, React/React DOM 19.3.1, Motion 14.3.0, Tailwind 4, Lucide, Fontsource, TypeScript, Playwright 1.64.1 y axe. `package-lock.json` fija la resolución; usar `npm ci`.

ESLint 9.39.5 se mantiene porque los plugins transitivos de `eslint-config-next` todavía declaran compatibilidad con ESLint 9. npm informa que esa versión está deprecada. Se investigó ESLint 10 y se descartó porque producía dependencias peer inválidas. No forzar ni ignorar los peers para ocultar el aviso; reevaluar cuando los plugins declaren soporte.

## Validación realizada

- `npm ci --no-audit --no-fund` con caché en `/workspace/.cache/npm`: completado con lockfile congelado.
- `npm run lint`: aprobado, sin errores ni advertencias del análisis.
- `npm run typecheck`: aprobado.
- `npm run build`: aprobado; portada, seis fichas y rutas auxiliares prerenderizadas.
- `npm test`: **17 aprobadas, 1 omitida por no aplicar el menú móvil al proyecto de escritorio, 0 fallidas** en la ronda completa aprobada.
- Pruebas de contactos, decodificación de WhatsApp, todas las fichas, 404, galerías, filtros, destacados, vacío y restablecimiento; imágenes cargadas y consola sin errores.
- Comprobaciones axe WCAG A/AA en portada y ficha, y menú abierto en móvil, sin infracciones detectadas en esos estados.
- Introducción por sesión, movimiento reducido, acceso sin JavaScript y ausencia de desbordamiento horizontal comprobados.

Se corrigieron en las rondas iniciales un favicon ausente, nombres accesibles imprecisos de selectores, contraste insuficiente en textos pequeños y un fallback de carga que impedía ver contenido sin JavaScript. Las pruebas mantienen sus aserciones.

Al reinstalar dependencias mientras un servidor de desarrollo estaba abierto, Turbopack perdió temporalmente módulos y conservó una caché inválida que devolvía 500. Se detuvo el proceso propio, se trasladó únicamente `.next/dev` (generado e ignorado) a `/tmp` y se reinició. La portada y una ficha volvieron a responder 200 con su contenido esperado. El script de instalación evita reutilizar esa caché después de reinstalar. No reinstalar dependencias con el servidor propio en ejecución.

`next-env.d.ts` queda ignorado conforme a la guía incluida en Next.js; `next dev` y `next build` lo regeneran. No editarlo ni incorporarlo como código fuente.

Las fotos usan importaciones estáticas: Next añade un hash de contenido a sus URLs para que reemplazar un archivo local invalide también las versiones optimizadas. Se detectó que las rutas públicas de nombre fijo conservaban imágenes anteriores durante esta sesión y se corrigió. `npm run typecheck` ejecuta primero `next typegen` para disponer de los tipos generados incluso en un checkout nuevo.

No se han medido Core Web Vitals de campo ni validado Safari, Android/iPhone físicos, entrega de mensajes, llamadas o correos reales. Se verifican destinos públicos y codificación; no se envían mensajes al asesor durante las pruebas.

## Pendientes y límites

1. Recibir los dos logos originales y el retrato de Thony; las rutas configurables están preparadas.
2. Recibir inventario real, fotografías autorizadas y contenido aprobado. Revisar `docs/ASSETS.md` antes de un lanzamiento comercial.
3. Confirmar Facebook; no habilitar enlaces adivinados.
4. Medir rendimiento en el despliegue y revisar dispositivos y navegadores reales.
5. Revisar el estado de publicación de la rama al retomar y preparar el PR cuando el acceso lo permita. Autorizar por separado el despliegue de producción. No se ha fusionado a main ni desplegado en Vercel.

La referencia Maddock respondió HTTP 403: no se capturó ni se afirma fidelidad visual a ella. La consulta de la API de GitHub mediante `gh` también devolvió Forbidden; el acceso de lectura mediante Git (`fetch`) sí funcionó. No se pidieron ni copiaron tokens para resolverlo.

## Riesgos de conflicto y siguiente tarea

El repositorio remoto solo contenía README al comenzar. Una implementación paralela no publicada sigue siendo invisible. Antes de continuar, leer la documentación, consultar GitHub otra vez y comparar especialmente `package.json`, lockfile, `src/app/globals.css`, `src/app/page.tsx` y documentos compartidos. Conservar el trabajo válido de ambos asistentes.

La siguiente tarea recomendada es incorporar la identidad y contenido autorizados; después, revisar una preview de Vercel. La reconstrucción 3D permanece exclusivamente en ROADMAP.

## Entorno reutilizable

Se guardaron `install_script` y `start_skill` en el borrador de configuración del entorno. El script probado instala con lockfile, conserva la caché generada de desarrollo fuera del checkout y ejecuta lint, build y TypeScript. El arranque de desarrollo se comprobó con respuestas 200 y contenido esperado en portada y ficha. También se agregó `api.github.com` a los dominios personalizados permitidos del borrador, conservando los presets, para permitir la API requerida por el PR; el proxy actual rechazó el túnel HTTPS con 403. El guardado no publica, aplica cambios de red ni inicia procesos en una tarea nueva; el usuario debe revisar y guardar la configuración y después publicar el entorno. No se ha verificado restauración en una tarea nueva.

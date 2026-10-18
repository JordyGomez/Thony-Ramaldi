# Transferencia de contexto

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

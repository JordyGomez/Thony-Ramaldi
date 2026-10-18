# Transferencia de contexto

## Estado actual — Fase 2, 2026-10-18

La base remota revisada es `106e9ced92847bfd2125535f3bd94e113a998a94`, merge del PR #1. El árbol de main coincide con la fase 1; no se encontraron cambios de código adicionales atribuibles a Claude/Yordi Lewis. La API de GitHub ya responde en esta sesión: el bloqueo histórico descrito abajo no continúa.

Rama actual: `feat/thony-phase-two`. Commits de código: `1b2b57e` (hero, entrada y navegación) y `464bbbe` (catálogo, galerías y contacto móvil). Los documentos posteriores se identifican en Git. Ningún archivo queda reservado a un asistente.

### Qué cambió

- Hero cinematográfico extraído a componente, preservando el resto de la portada, con dos CTA y parallax moderado solo en escritorio visible y sin movimiento reducido.
- Puerta CSS existente con profundidad, iluminación y fotografía; mismo máximo de 2,3 s y sesión. Salida segura con almacenamiento bloqueado, pestaña oculta o cambio de preferencia de movimiento. Eventos locales coordinan la entrada de títulos.
- Menú Motion con enlaces retirados inaccesibles durante la salida, foco, fondo inerte y navegación alternativa sin JavaScript.
- Constantes en `src/lib/motion.ts` y variantes de Reveal para imagen, bloque y contacto; no se añadieron dependencias.
- Filtros activos removibles, conteos derivados, transición de resultados inert, precios/controles legibles y foco conservado. Sin JS permanecen seis fichas navegables.
- Galería con teclado normal y ampliado, Home/End, gesto horizontal, controles de 44 px y carga/error/reintento reales. Se conservan diálogo nativo, Escape y recuperación del foco.
- CTA contextual fija en fichas móviles, con espacio al pie. Se mantienen datos, rutas, WhatsApp y advertencias de demostración.
- Fotografías ilustrativas de balcón y fachada reordenadas para mayor coherencia entre Penthouse Horizonte y Villa Serena; no cambian fichas, precios ni datos comerciales ficticios.

### Evidencia y comprobaciones actuales

- Auditoría y capturas antes/después en `docs/AUDIT-PHASE-2.md` y `docs/audit/`. Se revisaron producción, local y la referencia estética sin copiar recursos.
- `npm run lint`, `npm run typecheck` y `npm run build`: aprobados.
- `CI=true npm test`: **43 aprobadas, 1 omitida por no aplicar, 0 fallidas**. Incluye regresiones anteriores, foco durante salidas, teclado/gestos, error real de imagen, filtros retirables, entrada segura, preferencia dinámica y rutas sin JS.
- Axe sin infracciones detectadas en los estados de portada, ficha y menú probados; no es una certificación completa.
- Medianas locales sin throttling en tres contextos nuevos por tamaño: LCP 336 ms escritorio / 236 ms móvil emulado. Suma observada de desplazamientos 0.001569 / 0; no se calcula el CLS oficial por ventanas de sesión. Ver protocolo y comparación en auditoría, no extrapolar a rendimiento público o móviles físicos.
- Se detectó y corrigió un overflow de noscript en el encabezado durante la primera ronda. También se corrigieron fixtures de pruebas para Touch válido y búsqueda explícita del contenido noscript; se mantuvieron las aserciones funcionales.

### Despliegue y continuidad

GitHub informa `Vercel: success` y calidad aprobada para `main` 106e9ce. Eso no identifica de forma suficiente el SHA servido por el alias público; el contenido auditado coincide con la fase 1. No se ha fusionado fase 2 a main ni ejecutado despliegue manual de producción. Revisar la rama/PR y los checks antes de integrar.

Continúan pendientes los dos logos, retrato, fotografías autorizadas de mayor resolución, inventario real y Facebook confirmado. Los límites de licencia de imágenes se mantienen en ASSETS. No hay mapas, backend, motor IA ni visor 3D nuevo. El prompt adjunto de fase 2 terminaba en la sección de contacto; se conservaron todos los datos confirmados en la fase 1.

Antes de la siguiente tarea, consultar nuevamente main, la rama de trabajo, PR y documentación; no inferir que cambios privados de otro colaborador están disponibles. El stack y los comandos de instalación/arranque del entorno continúan siendo los mismos.

---

## Contexto conservado de la fase 1 — 2026-10-18

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

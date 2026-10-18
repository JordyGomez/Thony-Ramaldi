# Transferencia de contexto

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

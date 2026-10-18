# Registro de cambios

## 2026-10-18 — Claude / Yordi Lewis — Rediseño minimalista oscuro

- Solicitud de Yordi Lewis: tomar maddockdesign.com como referencia de diseño. Se revisó la referencia con capturas reales (escritorio, móvil, ficha y listado de proyectos) tras habilitar `maddockdesign.com` y `www.datocms-assets.com` en la red del entorno. Decisiones confirmadas por el usuario: tema oscuro y una sola tipografía sans fina.
- Paleta carbón/blanco con acento dorado sutil; Inter variable sustituye a Manrope y Cormorant Garamond (dependencias eliminadas).
- Portada: fotografía a pantalla completa con titular fino, presentación centrada, carrusel horizontal de propiedades con desplazamiento nativo y botones, catálogo con los mismos cinco filtros, "Sobre Thony" con tabla de pasos, contacto con titular grande y datos en columnas.
- Encabezado fijo con logotipo textual y menú a pantalla completa en todos los tamaños. Pie con navegación repartida, "THONY PAULINO" a todo el ancho y fotografía.
- Ficha: galería a pantalla completa con "Ampliar galería" y miniaturas; descripción a la izquierda y tabla de información a la derecha; tarjeta de consulta por WhatsApp.
- La entrada por sesión pasa de la puerta 3D a una entrada tipográfica sobria; conserva la limitación por sesión y la alternativa sin movimiento.
- Se mantienen todas las advertencias de demostración, el contacto oficial, los mensajes de WhatsApp y la ausencia de enlaces inventados.
- Prueba ajustada: la comparación del título con el mensaje de WhatsApp usa `textContent`, porque el título se muestra en mayúsculas solo por CSS; la aserción conserva su intención.
- Archivos: `src/app/` (layout, page, globals.css, ficha, 404, error, icono, Open Graph), `src/components/` (header, footer, catalog, property-card, gallery, preloader y nuevo `showcase.tsx`), `package.json`, `package-lock.json`, `tests/site.spec.ts`, README, AGENTS, ASSETS, ROADMAP, HANDOFF y este registro.
- Validación: `npm ci`, `npm run lint`, `npm run typecheck` y `npm run build` aprobados; `npm test` con Chromium preinstalado (configuración temporal fuera del repositorio para la ruta del navegador): 17 aprobadas, 1 omitida por no aplicar, 0 fallidas, incluidas axe WCAG A/AA y ausencia de desbordamiento a 360–1440 px. Revisión visual con capturas a 1440 y 390 px. No se midieron Core Web Vitals ni dispositivos físicos.

## 2026-10-18 — Codex / Yordi Gómez — Corrección de caché de imágenes

- En la revisión visual posterior se detectaron imágenes optimizadas anteriores pese a haber sustituido los archivos locales. Se utilizan importaciones estáticas para que Next genere URLs con hash del contenido en portada, catálogo y galerías.
- Se actualiza la comprobación de TypeScript para ejecutar `next typegen` antes de `tsc`, manteniendo `next-env.d.ts` como archivo generado e ignorado incluso en un checkout nuevo.
- Archivos: `src/data/properties.ts`, `src/app/page.tsx`, `src/components/gallery.tsx`, `package.json`, `docs/ASSETS.md`, HANDOFF y este registro.
- La rama se publicó mediante Git. Commit de implementación previo: `d6247bf`; corrección: `43f5b1a`, también publicada. El acceso a la API para crear PR sigue bloqueado; descripción preparada en `docs/PULL_REQUEST.md`.
- Validación de esta corrección: lint, TypeScript con generación de tipos y build aprobados; suite completa repetida sobre la nueva compilación: 17 aprobadas, 1 omitida por no aplicar y 0 fallidas.
- Se añadió `api.github.com` al borrador de dominios permitidos, conservando los presets existentes. El proxy actual rechaza el túnel HTTPS con 403; guardar el borrador no aplica la política a la instancia ni crea un PR.

## 2026-10-18 — Codex / Yordi Gómez

### Inspección y colaboración

- Se confirmó el remoto oficial `JordyGomez/Thony-Ramaldi`, el árbol local limpio y la ausencia de cambios adicionales frente a `origin/main` tras consultar GitHub.
- Base revisada: `6032a98216c0c841b56b8b1ab5c725441a65cbb8`, `Initial commit`. No se detectaron commits nuevos atribuibles a Claude o Yordi Lewis; no se atribuye el commit inicial a un asistente.
- Se creó la rama local `feat/thony-phase-one` sin reiniciar el historial, eliminar archivos ajenos ni crear repositorios adicionales.

### Funcionalidades y diseño

- Estructura Next.js/React/TypeScript, Tailwind y sistema CSS editorial con variables de color y fuentes locales.
- Portada, hero, introducción de puerta CSS 3D, navegación adaptable, animación de secciones, presentación del asesor y contacto oficial.
- Seis fichas inequívocas de demostración con tarjetas, selección de destacados, filtros por cinco criterios, alquiler mensual, estado sin resultados y limpieza.
- Rutas individuales estáticas, galería ampliable con teclado, características, advertencias y consulta contextual por WhatsApp.
- Error recuperable, 404, metadatos y Open Graph; fichas ficticias excluidas del índice y sitemap.
- Modelo preparado para referencias 3D opcionales sin motor, API, visor ni recorrido inexistente.

### Archivos afectados

- Modificado: `README.md`, anteriormente solo el título inicial.
- Creados: configuración npm/TypeScript/Next/PostCSS/ESLint/Playwright, `.nvmrc`, `.env.example`, `.gitignore`, `src/app/**`, `src/components/**`, `src/data/properties.ts`, `src/lib/site.ts`, seis imágenes locales y guía de marca.
- Creados: `AGENTS.md`, `CLAUDE.md`, `docs/ASSETS.md`, este CHANGELOG, HANDOFF y ROADMAP.
- Creados: `tests/site.spec.ts` y `.github/workflows/ci.yml`.
- Se conserva el bloque de instrucciones que Next añadió a AGENTS.md al iniciar desarrollo.
- No se eliminó ningún archivo preexistente del repositorio.

### Validación

- Instalación congelada, lint, TypeScript y build de producción completados.
- Suite completa de navegador: **17 aprobadas, 1 omitida por no aplicar, 0 fallidas**; escritorio y móvil, Chromium.
- Todas las rutas, imágenes, filtros, galería, enlaces de contacto, mensajes codificados, menú, foco, carga inicial, movimiento reducido, renderizado sin JavaScript y anchos de 360 a 1440 px verificados.
- axe no detectó infracciones WCAG A/AA en los estados probados de inicio, ficha y menú móvil.
- Se corrigieron los fallos iniciales de contraste, etiquetas de filtros, favicon y fallback sin JavaScript. No se deshabilitaron aserciones.
- Las pruebas de GitHub Actions y un despliegue de Vercel no se han ejecutado remotamente. Core Web Vitals de campo, Safari y dispositivos físicos no medidos.

### Limitaciones y continuidad

- Logotipos, retrato, Facebook y propiedades reales pendientes de recursos o confirmación del propietario.
- Procedencia de imágenes documentada; incorporar material autorizado antes del lanzamiento comercial.
- Referencia Maddock y API de GitHub devolvieron 403; Git por HTTPS sí permitió consultar el remoto.
- ESLint 9.39.5 mantiene compatibilidad de los plugins actuales, con aviso de deprecación del paquete; no se fuerza una versión con peers inválidos.
- Sin publicación automática en producción, fusión a main ni acciones de mensajería hacia Thony.

### Commit

La entrada se prepara antes del commit de esta entrega. Consultar el commit real con mensaje `feat: implement Thony Paulino real estate phase one` en Git; no se declara un SHA inexistente.

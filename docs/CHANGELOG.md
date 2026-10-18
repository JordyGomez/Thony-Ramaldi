# Registro de cambios

## 2026-10-18 — Codex / Yordi Gómez — Retirada de la foto ilustrativa del pie

- Petición del propietario mediante captura: quitar `villa.jpg` del pie y esperar una propiedad de los administradores. Base main `6ef6e98` (PR #7), rama `fix/footer-real-property-photo`, sin avances remotos ni cambios ajenos al iniciar.
- El pie conserva firma y contactos sin imagen ni hueco mientras falten fotos de una propiedad pública no demo; excluye renders y usa la primera foto real disponible. Layout y preview comparten selección; el recurso fijo se ignora también en configuraciones antiguas. Selección propia opcional en el editor y revalidación existente al publicar/ocultar/borrar.
- Adaptadas las comprobaciones públicas sin inventario y la prueba local de publicar/borrar una propiedad para verificar el ciclo de la foto. No se crean propiedades ni se ejecuta SQL en Supabase; la migración del editor continúa pendiente de quien administra ese proyecto.
- Lint, tipos y builds sin fixtures y con configuración pública real aprobados; **6 pruebas públicas + 12 de panel aprobadas**, incluidas aparición y retirada de la imagen al publicar/borrar en el doble local. Los checks remotos se verifican antes de integrar; no se afirma una publicación real de inventario.

## 2026-10-18 — Codex / Yordi Gómez — Diseño de Claude con 3D y administración integral

- Petición posterior del propietario: recuperar la composición de Claude, añadir 3D sobre ella, reparar las subidas y administrar el contenido. Base main `3adaf47` (PR #6); implementación **f164bd3**, rama `feat/claude-design-full-admin`. Se revisó el remoto sin avances nuevos antes de integrar; el usuario autorizó expresamente llevar la entrega a main al terminar.
- Restauradas portada `portada.jpg`, Inter/carbón y pie fotográfico de `0742704`, con avisos de fotografías ilustrativas. Profundidad por eventos, revelados y controles en perspectiva, menú escalonado, galerías y búsqueda personal por intención/zona/presupuesto/plazo con WhatsApp. No se crea inventario ni se generan personas, logos o viviendas.
- Panel ampliado: contenido/contactos/menú/SEO, imágenes/logo, orden y visibilidad, pasos, paleta y movimiento; biblioteca, diagnóstico, previsualización móvil/escritorio, borrador y publicación separados, historial y control de conflictos. SQL aditivo en `supabase/migrations/20261018_site_editor.sql`, con RLS privado y RPC transaccional.
- Subida al mismo origen con sesión/rol, comprobación de origen compatible con proxy, bytes y tamaño; optimización/transparencia, progreso, mensajes específicos y reintento. Borrar una ficha conserva los archivos compartidos de la biblioteca.
- Validación local: instalación congelada 402 paquetes, lint/tipos/builds aprobados; **84 regresiones + 6 públicas + 12 del panel + 9 SQL = 111 aprobadas**, sin omitidas ni fallidas. PGlite 0.5.10 se usa solo en desarrollo. Las operaciones de panel se prueban con un doble HTTP local; no se hicieron login, migración ni escrituras en el Supabase real.
- En la lectura real: propiedades 200 y cero filas; tablas nuevas aún 404/PGRST205. El propietario debe ejecutar la migración para activar guardado/publicación del editor. Hasta entonces la web conserva los valores de Claude y el panel explica la activación. Informe, capturas y límites en CLAUDE-ADMIN-REVIEW; los checks remotos y Vercel se comprueban al publicar.


## 2026-10-18 — Codex / Yordi Gómez — Evolución cinematográfica y contenido auténtico

- Se parte del main 0742704 (PR #5 de Claude), con PR #4 ya fusionado, en feat/cinematic-ramaldi-experience. Se revisaron las nuevas rutas agrupadas, Supabase, panel, retrato, nueva portada y eliminación de Facebook. Se repitió fetch antes del commit: main sin avances adicionales.
- Implementación **7ce368a**: puerta sólida en CSS con espesor, hoja, tirador, marco y retrato oficial, versiones desktop/móvil y transición al hero. Se conserva sesión, entrada inicial por home, espera real del recurso crítico, límite de 5 s, interacción para saltar, movimiento reducido y no JS; duración normal 2,1 s. Escena memoizada y señales acotadas de revelado.
- Hero y pie usan arquitectura de marca en lugar de viviendas ilustrativas, por el nuevo brief; se conservan los archivos seleccionados antes y su procedencia. No se generan personas, videos, propiedades ni fotografías. El logo del chat sigue pendiente como fichero reutilizable; se mantiene site.logo preparado y presentación tipográfica.
- Menú con entrada escalonada y foco/inert conservados, tokens de movimiento, revelados diferenciados, retrato editorial, profundidad de tarjetas, contacto y estado vacío con WhatsApp/teléfono. El CSS cinematográfico se carga en el layout público y la profundidad por eventos se limita a dispositivos elegibles y elementos visibles, sin bucle permanente.
- getProperties conserva lectura/caché/errores de Supabase y excluye registros demo. Desactivar Supabase deja catálogo vacío; fixtures solo con THONY_TEST_FIXTURES=1 fuera de Vercel. CI añade una segunda compilación sin fixtures. Sin modificaciones de Auth, panel, acciones, uploads, proxy, mapping, esquema, RLS, dependencias o configuración de Vercel.
- Validación: npm ci con lockfile de main, lint, typecheck y builds aprobados; **82 regresiones + 6 comprobaciones públicas aprobadas, 0 omitidas y 0 fallidas**. Lectura pública real: HTTP 200, cero publicaciones. Se comprobó /admin → /admin/login de forma anónima, sin efectuar login o escrituras. Una etiqueta accesible de marca detectada por axe se corrigió y se repitió la comprobación.
- Lighthouse móvil simulado final: performance 92, accesibilidad automática 100, LCP 3,125 s, TBT 67 ms, CLS 0; main de referencia 92/100, LCP 3,102 s y TBT 98 ms. Se conserva la regresión intermedia detectada y su optimización. Capturas, protocolo, límites y materiales pendientes en CINEMATIC-REVIEW y PRELOADER. Entrega mediante nueva rama/PR y Preview; no se fusiona a producción.

## 2026-10-18 — Claude / Yordi Lewis — Nueva fotografía de portada

- La imagen anterior (`hero.jpg`, 800 px de ancho) se veía borrosa a pantalla completa. Se buscaron fotos gratuitas en Unsplash (excluyendo Unsplash+), se mostraron cuatro candidatas sobre la portada real y el usuario eligió la casa blanca con palmeras al anochecer de Salman Saqib.
- `public/images/portada.jpg` (2400×1350, 474 KB) con importación estática; crédito y licencia en `docs/ASSETS.md`. Se conserva el aviso “Fotografía ilustrativa”.
- `tests/preloader.spec.ts` interceptaba la imagen del hero por su nombre de archivo (`hero.*.jpg`); el patrón pasa a `portada.*.jpg` sin cambiar lo que comprueban las pruebas.
- Validación: lint, typecheck y build aprobados; `npm test` 76 aprobadas, 0 fallidas; capturas a 1440 y 390 px. La imagen del pie (`villa.jpg`, 850 px) tiene el mismo problema de resolución y queda pendiente de decisión.


## 2026-10-18 — Claude / Yordi Lewis — Retrato de Thony y sin Facebook

- Yordi Lewis entregó la foto oficial de Thony y confirmó que no tiene Facebook.
- Retrato en `public/images/thony-paulino.jpg` (importación estática en `site.portrait`): “Sobre Thony” lo muestra anclado arriba para no recortar el rostro, y la tarjeta de consulta de cada ficha añade un recorte circular con nombre y cargo.
- Se elimina Facebook: `site.facebook`, la variable `NEXT_PUBLIC_FACEBOOK_URL` y el marcador “Enlace por confirmar”. Su lugar en el bloque de contacto lo ocupa WhatsApp.
- Prueba ajustada: en lugar de exigir “Enlace por confirmar”, comprueba que no aparezca Facebook y que el retrato esté presente.
- Validación: lint, typecheck y build aprobados; `npm test` 76 aprobadas, 0 fallidas; capturas a 1440 y 390 px del retrato, el contacto y la tarjeta de consulta.


## 2026-10-18 — Claude / Yordi Lewis — La web muestra solo las propiedades del panel

- Solicitud de Yordi Lewis: quitar las propiedades estáticas para que todas las que aparezcan sean las subidas al panel.
- `getProperties()` ya no recurre a datos locales con Supabase activo: tabla vacía = sin propiedades; error de lectura = excepción, para que Next conserve la última página generada (y un build falle en lugar de publicar una web vacía). Los datos locales pasan a `sampleProperties`, usados solo con Supabase desactivado (CI y pruebas) y para importar.
- Proyecto oficial `uowylfdlirlfqksvdeer` con URL y clave publishable como valores por defecto en `src/lib/supabase/env.ts`; CI compila con las variables vacías.
- La importación del panel copia solo fichas reales (Alberobello); las seis demostraciones ficticias no se importan. Textos del panel vacío actualizados.
- Estados vacíos: el catálogo muestra “Pronto publicaremos nuevas propiedades” con contacto por WhatsApp y el carrusel se oculta. Descripción del sitio, Open Graph y aviso del pie ya no nombran Alberobello ni las demostraciones. La tarjeta dice “Precio provisional” en venta y “Renta provisional” en alquiler.
- Validación: lint, typecheck y build (Supabase desactivado) aprobados; `npm test` 76 aprobadas, 0 fallidas; estado vacío revisado con una captura mediante una ruta temporal no incluida. Sigue sin probarse contra el proyecto real desde este entorno (red bloqueada).


## 2026-10-18 — Claude / Yordi Lewis — Panel de propiedades propio con Supabase

- Solicitud de Yordi Lewis: un apartado para que Thony publique propiedades sin tocar código. Primero se preparó con Sanity (commit `bd507a5`, nunca fusionado); el usuario prefirió no depender de un gestor de contenido externo y eligió Supabase con un panel construido a medida. Sanity y sus dependencias se eliminaron.
- Se revisó el remoto antes de editar: el PR #4 de Codex se fusionó a main (`dfdeb8e`) a petición del usuario y esta rama parte de ese main. El PR #2 sigue abierto y obsoleto según la propia documentación de Codex.
- Panel en `src/app/admin/`: inicio de sesión (Supabase Auth), lista con estado/publicación/destacada, crear, editar, ocultar y borrar (con sus archivos), e importación única de las siete fichas locales con fotos y folleto. Formulario en español con validación, subida directa de fotos al bucket con reducción a 2400 px en el navegador, orden y descripción de cada foto, folleto PDF y datos de proyecto. `src/proxy.ts` (convención de Next 16) renueva la sesión y protege `/admin`.
- `supabase/schema.sql`: tabla `properties`, tabla `admin_users`, función `is_admin()`, RLS (lectura pública de publicadas; escritura solo administradores) y bucket público `properties` con escritura restringida.
- `getProperties()` (`src/data/get-properties.ts`) como fuente única: Supabase con revalidación de 60 s y regeneración inmediata al guardar; datos locales si no está configurado, si falla o si la tabla está vacía. Portada, carrusel, catálogo, bloque Alberobello y fichas reciben los datos por props; las fichas nuevas se generan bajo demanda.
- Rutas públicas movidas al grupo `src/app/(site)/` con su layout (skip link, header, pie) para que el panel no herede el envoltorio del sitio. Las URL no cambian; el 404 raíz reutiliza el layout del sitio.
- Estados explícitos de ficha: Demostración, Ficha en preparación (`inPreparation`) y Disponible. Antes, cualquier ficha no demostrativa se presentaba como Alberobello (renders, renta provisional, textos de WhatsApp). Los textos de Alberobello y de las demostraciones se conservan idénticos; se añaden `projectName`, `imagesAreRenders` y el tipo de galería `photo` sin aviso de procedencia.
- Ubicaciones del filtro derivadas de los datos; tipos y operaciones compartidos en `src/data/property-options.ts`. El bloque de Alberobello se localiza por slug. `next.config.ts` admite imágenes del almacenamiento público de Supabase; `robots.txt` excluye `/admin`.
- Dependencias: `@supabase/supabase-js@2.117.1` y `@supabase/ssr@0.12.7` (más de dos semanas de antigüedad, sin peers inválidos).
- Validación: lint, typecheck y build aprobados. Build con configuración ficticia: Supabase inaccesible, la web cayó a los datos locales y `/admin` y `/admin/nueva` redirigieron a `/admin/login`. Formulario y pantallas revisados con capturas a 1440 y 390 px mediante una ruta temporal no incluida. `npm test`: 76 aprobadas, 0 omitidas, 0 fallidas (72 previas + 4 de `tests/admin.spec.ts`). No se probó contra un proyecto Supabase real: inicio de sesión, subida de fotos, guardado e importación quedan por verificar al activarlo.

## 2026-10-18 — Codex / Yordi Gómez — Mejora exclusiva del preloader

- Se revisaron remoto, PR #4 y texto adjunto antes de editar. Sin cambios remotos nuevos respecto al main d0f5f09 y la rama publicada c3e256e; se continúa sobre la integración existente. El usuario priorizó mejoras aditivas y conservar el diseño.
- Implementación a5ae5b8: composición tipográfica de Claude conservada y detalle de marco/apertura 3D mediante CSS. Solo se modifica preloader.tsx y su bloque en globals.css; no se alteran portada, catálogo, fichas, navegación, datos ni dependencias.
- Espera real de hero decodificado y fuentes, respiración de línea al retrasarse, límite absoluto de 5 s, fallback CSS y salida por interacción, pestaña oculta o movimiento reducido. Se mantiene una vez por sesión y se evita activar al llegar por SPA desde una ficha. La decisión tolera el ciclo adicional de efectos de Strict Mode.
- Preparado para el archivo autorizado mediante site.logo; no se inventa logo ni se sustituye la marca tipográfica actual. Se descarta rehacer el diseño, recuperar la antigua puerta del tema claro o prometer rendimiento universal sin medición.
- Lint, typecheck y build aprobados. Suite completa: **72 aprobadas, 0 omitidas, 0 fallidas**, escritorio y móvil. Diez ejecuciones nuevas de carga lenta, imagen fallida, límite, navegación SPA y teclado; 62 regresiones previas preservadas. Capturas actuales inspeccionadas y límites en PRELOADER.md. Entrega mediante el PR #4 existente, sin fusión automática a producción.

## 2026-10-18 — Codex / Yordi Gómez — Integración sobre el diseño de Claude

- El usuario autorizó posteriormente guardar commits, subir la rama y crear su PR contra main para activar la Preview de Vercel. Implementación: `6260099`. README documenta la conexión GitHub/Vercel ya existente, la revisión del PR y el despliegue de producción al fusionar a main; guardar la configuración cloud no realiza esa fusión. Consultar los checks del PR para su resultado remoto. No se fusiona automáticamente a main.

- A petición del usuario, se parte de main `d0f5f09` (PR #3 de Claude) en `feat/ramaldi-alberobello-integrated`, en el mismo checkout. Se conservan carbón, Inter, composición de portada, carrusel, menú completo, galerías grandes y pie. AGENTS, dependencias, lockfile, 404, icono y Open Graph de Claude se mantienen.
- El borrador anterior se protege en un stash identificado y respaldo temporal completo; no se sobrescribe ni elimina trabajo. El PR #2 anterior no se modifica ni se publica como si estuviera integrado.
- Se incorporan Alberobello, PDF y cuatro renders, renta provisional autorizada de US$1,000, datos de unidad por confirmar, selección Reales, filtros activos retirables, conteos derivados y contactos contextuales. El carrusel distingue la ficha real de las demostraciones.
- Se conservan mejoras de teclado, gestos, carga/error/reintento, no JS, foco y salidas inertes. La introducción sigue siendo tipográfica, como la de Claude, con memoria por sesión y salida segura. Menú y sus pruebas aplican a todos los tamaños.
- La paleta Ramaldi aparece en acentos legibles y CTA contextual; no reemplaza el fondo carbón ni la tipografía. Renders identificados desde la apertura de galería.
- Validación local final de integración: npm ci, lint, tipos y build aprobados; 62 pruebas aprobadas, 0 omitidas y 0 fallidas, sobre la compilación final. Capturas y límites en AUDIT-INTEGRATION.md; detalles de continuidad en HANDOFF.

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


## Entradas conservadas del borrador anterior

Los estados locales y de publicación de estas entradas corresponden a su momento de ejecución, anterior a esta integración.

## 2026-10-18 — Codex / Yordi Gómez — Revisión de compatibilidad previa a publicación

- Nuevo fetch: detectado el rediseño de Claude en `79da3d3`, fusionado mediante PR #3 en main `d0f5f09`.
- Revisados sus cambios, documentación, dependencias y checks, y comparados con la fase 2 y Alberobello local mediante simulaciones sin modificar código ni ramas.
- Detectados 17 archivos compartidos modificados y 13 con conflictos de texto al considerar el borrador; también hay riesgos de etiquetar Alberobello como demostración y representar datos desconocidos como null en los componentes remotos.
- Informe y pasos pendientes en `REVIEW-CLAUDE.md`. No se efectuaron integración, commit, push ni despliegue. El resultado de pruebas anterior no se atribuye a una versión combinada.

## 2026-10-18 — Codex / Yordi Gómez — Identidad Ramaldi y Alberobello, continuación local

### Alcance y colaboración

- Se continúa sobre `feat/thony-phase-two`, base `e82367a`, conservando la fase 2 existente y las seis demostraciones. La consulta remota no mostró commits nuevos respecto de la base revisada.
- El PR #2 corresponde a la entrega anterior. Esta continuación permanece sin commit, push, actualización del PR ni despliegue, según la indicación del usuario de que todavía no se subirá.

### Cambios reales

- Paleta aproximada a las referencias de logo Ramaldi aportadas: verde `#437976`, dorado `#DEA900` y dorado claro `#F5E8B3`, con variantes para contraste. Se ajustan superficies, acciones, puerta y metadatos visuales. No se inventa un logotipo; falta el archivo reutilizable.
- Ficha real en preparación de Alberobello Residences, referencia `ALB-001`, bloque destacado en portada y selección **Reales** en el catálogo. Se conservan las seis fichas ficticias y sus advertencias.
- El usuario desconoce renta y datos de unidad y autorizó un precio para la maqueta. Se muestran **US$1,000/mes provisionales**, claramente señalados en sus superficies de precio; la cifra no procede del PDF ni constituye una renta confirmada.
- Superficie, habitaciones, baños y parqueos de la unidad permanecen `null`; la cifra provisional y los valores desconocidos no se usan como datos confirmados en filtros de presupuesto y habitaciones.
- Se separan las características y tipologías publicitadas del proyecto de los datos pendientes de la unidad. Cuatro renders extraídos del folleto conservan su identificación como renders, con galería accesible y descarga del PDF original sin alterar sus bytes.
- Contacto contextual a Thony para confirmar condiciones y solicitar fotografías actuales. La ficha lleva `noindex`, queda fuera del sitemap y no expone una renta confirmada como dato estructurado. Sin nuevas dependencias, backend o motor 3D.

### Archivos y validación

Modificados datos, configuración de contacto, estilos compartidos, portada, catálogo, tarjetas, galería, ficha y metadatos. Añadidos `src/components/featured-rental.tsx` y su módulo CSS, `tests/alberobello.spec.ts`, cuatro WebP del folleto, PDF original y `docs/ALBEROBELLO.md` / `docs/BRAND.md`. Se actualizan pruebas existentes, README, CLAUDE, ASSETS, guía de marca, HANDOFF y ROADMAP; se conserva el historial anterior.

- Lint, generación/comprobación de tipos y build de producción aprobados.
- Suite final de navegador: **57 aprobadas, 1 omitida por no aplicar, 0 fallidas**. Incluye las seis demostraciones y el nuevo alquiler en preparación, renders, precio provisional, datos null, filtros, PDF original, no JS y contacto contextual.
- Axe sin infracciones en los estados probados y sin overflow en los cinco anchos de regresión. No se afirma compatibilidad con Safari, dispositivos físicos ni accesibilidad completa.
- Revisión visual actual en escritorio y móvil: se compactaron título y aviso de la ficha móvil para adelantar el render; capturas y notas en `AUDIT-ALBEROBELLO.md`.
- En la primera ronda se alineó la advertencia no comercial y se corrigió una expresión de alt que rechazaba «de la»; se conservaron las aserciones y se repitió la suite completa sobre la compilación final.

No hay un SHA de commit de esta continuación. Archivo de logo reutilizable, retrato, Facebook, datos y fotos actuales de la unidad siguen pendientes. El estado local y los requisitos antes de publicar se documentan en HANDOFF y ALBEROBELLO.

## 2026-10-18 — Codex / Yordi Gómez — Fase 2 de experiencia

### Base y auditoría

- Se consultaron todas las ramas y PR. Main avanzó mediante el merge `106e9ce` del PR #1, sin diferencias adicionales de código respecto a la fase 1. No se detectaron cambios atribuibles a Claude/Yordi Lewis ni conflictos.
- Se creó `feat/thony-phase-two` desde origin/main, conservando la aplicación existente.
- Se capturaron y revisaron portada, catálogo y ficha de producción y local, además de Maddock como referencia estética. La validación TLS se mantuvo a través del proxy disponible. La evidencia Vercel/GitHub y sus límites están en `AUDIT-PHASE-2.md`.

### Cambios reales

- Hero inmersivo con CTA claros y movimiento coordinado con la puerta CSS existente; parallax acotado por dispositivo/preferencia/visibilidad.
- Iluminación, marco y profundidad de la puerta, manteniendo duración y sesión; salida segura ante almacenamiento bloqueado o cambio a movimiento reducido.
- Menú animado con foco, fondo inerte y alternativa sin JS. Variantes de Reveal y constantes compartidas de Motion.
- Filtros activos removibles, conteos derivados, resultados animados inaccesibles durante salida y mejoras de tarjetas/precios/controles.
- Galería con carga/error/reintento real, teclado normal/ampliado y gesto horizontal; CTA contextual persistente en móvil y mejoras editoriales de fichas.
- Reordenadas dos imágenes ilustrativas para coherencia de tipología, conservando seis fichas y datos. Sin nuevas dependencias, mapas, ofertas reales, biografía, logos inventados ni motor 3D.

### Archivos

Modificados `src/app/page.tsx`, `src/app/propiedades/[slug]/page.tsx`, componentes existentes de navegación, entrada, catálogo, tarjetas, galería y Reveal, y `src/data/properties.ts`. Añadidos `hero.tsx`, `src/lib/motion.ts`, módulos CSS acotados, tres archivos de pruebas de fase 2, auditoría y capturas. README, CLAUDE, HANDOFF y ROADMAP se actualizan conservando el registro anterior. No se reemplaza la aplicación ni se eliminan componentes funcionales.

### Validación

- Lint, TypeScript y build de producción aprobados.
- Playwright/Chromium: **43 aprobadas, 1 omitida por no aplicar y 0 fallidas**. Se mantienen las pruebas anteriores y se añaden estados nuevos.
- Axe sin infracciones en estados probados de portada, ficha y menú móvil. Sin overflow en 360, 390, 768, 844 y 1440 px; teclado, foco, no JS y movimiento reducido comprobados.
- Se corrigió un overflow del noscript del encabezado detectado en la primera ronda. Los fixtures Touch y búsqueda noscript se corrigieron según el DOM real, sin retirar aserciones.
- Capturas posteriores aceptadas tras decodificar imágenes. Laboratorio local documentado con el mismo protocolo inicial; no equivale a Web Vitals de campo ni Safari/dispositivos físicos.

### Commits y continuidad

Código: `1b2b57e` y `464bbbe`. La actualización documental posterior se consulta en Git. Publicación en rama de trabajo; no se fusiona a main ni se despliega manualmente a producción. La siguiente revisión requiere contenido e imágenes autorizados y comprobar la preview y checks del PR.

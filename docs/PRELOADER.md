# Estado vigente: introducción retirada

El propietario pidió profesionalizar el movimiento o quitarlo. La presentación actual es estática: HomeContent no monta Preloader, la portada se muestra inmediatamente y no espera a que termine una foto. Los valores antiguos de movimiento/intro se normalizan a off/entry=false. Las pruebas conservan cobertura de fotos lentas/fallidas, teclado y navegación, verificando acceso sin overlay. El contenido siguiente documenta implementaciones anteriores; no debe reactivarse a partir de ese historial.

## Registro anterior — entrada 3D sobre la composición de Claude

La instrucción vigente recupera la portada fotográfica de Claude. La entrada sigue revelando el retrato oficial, una vez por sesión y con las salidas seguras documentadas abajo; espera la fotografía de portada, ahora `portada.jpg`, no el retrato de la pantalla principal anterior. La identidad y el logo se gestionan en `/admin/web` y las preferencias permiten desactivar la introducción o todo el movimiento. La geometría de la puerta se utiliza en la entrada; la portada y el catálogo vuelven a su composición fotográfica y tipográfica.

La integración se documenta en [CLAUDE-ADMIN-REVIEW](CLAUDE-ADMIN-REVIEW.md). El siguiente registro conserva la entrega anterior del PR #6 y sus mediciones; no describe una portada vigente con retrato.

## Registro histórico — The Entrance del PR #6

2026-10-18. Implementación 7ce368a sobre main 0742704, después del panel de Claude y la fusión del PR #4. El nuevo brief autoriza evolucionar la entrada y la presentación pública; el registro anterior se conserva abajo como historia, no como especificación vigente.

## Secuencia y recursos

ArchitecturalDoor construye una puerta con hoja, caras, espesor, tirador, marco y umbral mediante CSS. Abre sobre su borde y revela el retrato oficial public/images/thony-paulino.jpg, aportado por el propietario. La fotografía se trata como un plano: no se inventan cuerpo, gestos ni una grabación de Thony abriendo la puerta. La composición cambia de encuadre, perspectiva y separación en móvil.

Después aparece la identidad tipográfica existente y se produce el relevo al hero. El logo real se mostrará al configurar site.logo; ante error de ese archivo se recupera el nombre. Las dos referencias adjuntas solo están disponibles visualmente en el chat, sin fichero reutilizable en el checkout. No se recrean. No se descarga un video ni se genera una persona. ArchitecturalDoor admite contenido en su plano interior para un futuro clip auténtico autorizado; no es necesario para la experiencia actual.

## Lógica conservada y afinada

- Primera entrada elegible por home y una vez por sesión. Navigation Timing evita activarla si el documento inicial se abrió por una ficha o /admin y luego se llegó por SPA. Se mantiene no repetir al refrescar en la misma sesión.
- SessionStorage y memoria de módulo si está bloqueado; ref de elegibilidad para tolerar el ciclo extra de efectos en desarrollo. Sin JavaScript no se renderiza el overlay.
- entryTiming.sequence = 1600 ms, exit = 500 ms: 2,1 s nominales. Se esperan únicamente el hero decodificado y document.fonts.ready. Errores de carga/decodificación dejan continuar.
- Si lo crítico tarda, solo respira la opacidad de la línea; la puerta no reinicia. El máximo absoluto es 5000 ms, tanto por temporizador como por CSS. No hay porcentajes ficticios.
- Teclado, toque/clic, rueda, ocultar pestaña y movimiento reducido permiten salida inmediata. No se bloquea scroll ni se captura foco; la decoración es aria-hidden.
- EntryArtwork está memoizado: cambios de fase no reconstruyen la escena. Se mantienen transform y opacity, sombras y materiales estáticos y ningún bucle JavaScript por frame.
- El estado de revelado se comunica al hero/cabecera y mediante entryEvents. Los selectores de animación se limitan a esos elementos; la base se mantiene visible si falla la señal. La limpieza cancela timers, frames y listeners.

Los estilos se cargan desde src/app/(site)/layout.tsx y cinematic.css, fuera del panel. La geometría comparte architectural-door.module.css con la portada y el estado vacío. Se conserva el stack y no se añaden dependencias.

## Comprobación

Lint, tipos y builds aprobados. 82 regresiones Chromium aprobadas, incluidas sesión, SPA, storage, movimiento reducido inicial/dinámico, errores, carga lenta, límite, teclado y no JS; otras 6 comprobaciones públicas sin fixtures aprobadas. Retrato, relevo al hero, profundidad fuera de pantalla y ahorro de datos se prueban en tests/cinematic.spec.ts. La intercepción de carga lenta en tests/preloader.spec.ts sigue ahora el retrato crítico del hero, sin reducir sus aserciones.

Capturas, comparación de laboratorio y límites en [CINEMATIC-REVIEW](CINEMATIC-REVIEW.md). No se probaron Safari, teléfonos físicos ni consumo de batería/GPU. El logo original como archivo y un eventual video real siguen pendientes; no se afirman integraciones de medios inexistentes.

---

# Registro anterior — mejora acotada de la introducción

Revisión del 2026-10-18, implementación `a5ae5b8`. Se consultaron GitHub y los cambios existentes antes de editar: main seguía en `d0f5f09`, el PR #4 permanecía abierto y su rama en `c3e256e`. La continuación conserva toda la integración de Alberobello y el diseño oscuro de Claude.

## Qué se conserva y qué se adapta del texto

El usuario indicó que el texto adjunto no debía reemplazar lo construido. Se conservan Inter, fondo carbón, nombre THONY PAULINO, línea, leyenda, entrada tipográfica, montaje exclusivamente en la home y la marca de sesión `thony-entry`. La puerta pasa a ser un detalle geométrico detrás del texto, con perspectiva y apertura CSS una sola vez. No se recupera la antigua puerta de la versión clara ni se introduce una nueva escena que sustituya la composición de Claude.

Se descartan cambios de portada, catálogo, propiedades, navegación, datos, marca o dependencias. No se inventa el logo: `site.logo` sigue vacío y se mantiene la identidad tipográfica existente. Cuando se configure un archivo autorizado, el componente lo mostrará con `next/image`; si falla, recuperará el texto. Elegir un archivo que contraste con el fondo oscuro. No se promete fluidez en todos los dispositivos sin medirlos.

## Lógica

- Solo puede comenzar si el documento inicial se abrió en `/`, la pestaña está visible, no se prefiere movimiento reducido y la sesión no vio la introducción. Se usa Navigation Timing para distinguir una entrada inicial de una llegada por SPA desde una ficha; si no está disponible, se omite la introducción.
- Se conserva una vez por sesión, incluso al refrescar. El texto permitía repetir al refrescar, pero no lo exigía; se mantiene la regla existente. La memoria del módulo evita repeticiones de navegación cuando sessionStorage está bloqueado. La decisión se conserva en un ref para tolerar el ciclo adicional de efectos de Strict Mode.
- La secuencia dura 1,7 segundos y la salida 0,6 segundos cuando la primera pantalla está lista. Se esperan la carga/decodificación de `.hero-image` y `document.fonts.ready`, sin esperar las imágenes lazy ni recursos del resto del sitio.
- Si siguen pendientes, solo respira la opacidad de la línea. La puerta y el texto no reinician sus animaciones. Al completarse o fallar la imagen, se permite la salida; los errores de decodificación tampoco retienen el contenido.
- A los cinco segundos se desmonta aunque siga pendiente un recurso. CSS también oculta el overlay a ese límite si la actualización de React falla. No se anima con JavaScript por frame ni se bloquea el scroll.
- Teclado, toque/clic o rueda permiten saltarla inmediatamente. Ocultar la pestaña o activar movimiento reducido también la retira. El overlay es decorativo y aria-hidden; no captura foco y no intercepta eventos. Sin JavaScript no se renderiza.

## Evidencia visual actual

Capturas guardadas e inspeccionadas en esta revisión, usando Chromium, 1440 × 1000 y 390 × 844. La animación se capturó aproximadamente 800 ms después de aparecer. Corresponden a compilaciones locales de producción, no a capturas autenticadas de Vercel.

### 1. Composición conservada — verificada

![Introducción anterior en escritorio](audit/preloader/before-desktop.png)

![Mejora en escritorio](audit/preloader/after-desktop.png)

![Mejora en móvil](audit/preloader/after-mobile.png)

El nombre, la línea y la leyenda mantienen su posición y jerarquía. Se añade únicamente el marco y la apertura geométrica, en tonos suaves de Ramaldi. No se presenta la identidad tipográfica como si fuera un logo oficial.

### 2. Carga lenta real — verificada

![Espera con el hero retenido en red](audit/preloader/waiting-mobile.png)

La solicitud de la imagen principal se mantuvo pendiente. La introducción pasó al estado de espera y conservó la puerta abierta; solo la línea repite una animación de opacidad. Las pruebas comprobaron la salida al liberar la solicitud, al fallar la imagen y al agotarse el límite de seguridad.

### 3. Acceso al contenido — verificado

![Home después de la introducción](audit/preloader/home-mobile.png)

La portada y sus controles conservan su diseño. No se modificaron sus componentes, imágenes, filtros, fichas ni contactos. No se detectaron errores de aplicación ni overflow en las dos capturas de salida.

## Validación y límites

Lint, typecheck y build aprobados. `CI=true npm test`: **72 aprobadas, 0 omitidas, 0 fallidas**, Chromium escritorio y móvil. Las diez ejecuciones nuevas cubren llegada por SPA desde una ficha, espera de imagen, error, recurso que no termina y salida con teclado. Se conservaron las 62 comprobaciones anteriores, incluidas sesión/refresh, storage bloqueado, movimiento reducido inicial y dinámico, no JS, accesibilidad automática y regresiones de catálogo/fichas.

No se han probado Safari, teléfonos físicos de gama baja, consumo de GPU ni Core Web Vitals de campo. El renderizado del logo original queda pendiente de recibir el archivo. Los resultados de Vercel y GitHub Actions de esta continuación se consultan en el PR #4; las verificaciones anteriores del PR correspondían a otro commit.

Archivos de aplicación modificados: `src/components/preloader.tsx` y exclusivamente el bloque de entrada de `src/app/globals.css`. Pruebas nuevas en `tests/preloader.spec.ts`. La documentación compartida registra la continuación para Claude / Yordi Lewis. No se fusiona automáticamente a main.

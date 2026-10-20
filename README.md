# Thony Paulino · Ramaldi

## Plataforma de dos identidades — preparada, sin activar Ramaldi

La ampliación de PR #12 conserva esta web, el panel de Claude y Supabase. Añade una identidad empresarial independiente, roles por UID, incorporación con invitación/verificación/aprobación, perfiles profesionales, inmuebles propios con revisión, planos/documentos privados y auditoría. El modo público sigue siendo **Thony**. El selector y la vista previa empresarial requieren SUPERADMIN real, validado en servidor y RLS; `admin_users` no concede ese permiso.

Código y migraciones se entregan para revisión: no se ejecutó DDL ni se activó Ramaldi en producción. Requiere revisión/instalación del propietario de Supabase, bootstrap explícito de una cuenta verificada y autorización corporativa antes de activar. Los contactos corporativos desconocidos permanecen vacíos. Cambiar modo no copia ni borra inventario/configuración; volver a Thony usa la misma operación transaccional, sin redeploy.

- [Arquitectura y revisión de Claude](docs/PLATFORM-ARCHITECTURE.md).
- [Permisos, incorporación y aprobación](docs/PLATFORM-PERMISSIONS.md).
- [Instalación, aprobación corporativa, activación y reversión](docs/PLATFORM-OPERATIONS.md).
- [Seguridad y archivos](docs/PLATFORM-SECURITY.md) · [pruebas aisladas](docs/PLATFORM-TESTING.md).

Nuevas rutas privadas: `/admin/empresa`, `/admin/plataforma` y `/admin/plataforma/vista-previa`. El formulario de propiedades, autenticación y componentes existentes se reutilizan. El contenido público usa un snapshot coherente por petición; el 404, SEO, sitemap y Open Graph también dependen del modo. Las rutas de asesores y el registro corporativo no se habilitan en Thony.

La migración aditiva es `supabase/migrations/20261020_dual_mode_platform.sql`, después de la del editor personal. El hook de invitaciones debe conectarse en Supabase Auth antes de habilitar altas. Turnstile requiere `NEXT_PUBLIC_AUTH_CAPTCHA_SITE_KEY` y configuración del proveedor en Supabase. No se añaden claves privilegiadas ni otro Auth/base de datos. `npm run test:platform` comprueba Next y PostgreSQL/RLS aislados; reconstruye `.next`, como `test:admin`, por lo que las suites se ejecutan secuencialmente.

Sitio profesional y catálogo inmobiliario de **Thony Paulino**, asesor de **Ramaldi**, orientado a República Dominicana. La dirección vigente recupera la composición de Claude: portada fotográfica a pantalla completa, Inter fina, carbón y firma grande al pie. La presentación actual es estática, por petición del propietario: sin introducción, paralaje, giros, zoom ni efectos decorativos. El contenido aparece directamente y los controles responden de inmediato.

El pie espera las fotografías de una propiedad publicada por un administrador: sin ellas se muestran solo firma, navegación y contactos, sin imagen ilustrativa ni hueco reservado. Se usa la primera foto del inventario público, excluyendo demostraciones y renders. La selección propia del panel es opcional y también requiere ese inventario; el recurso antiguo `villa.jpg` no se reactiva desde configuraciones anteriores. Guardar, ocultar o borrar propiedades actualiza el pie mediante la revalidación existente.

La web pública obtiene **solo propiedades publicadas y no marcadas como demostración en Supabase**. Sin inventario, muestra una selección en preparación y contacto por WhatsApp o teléfono. Los datos locales de ejemplo son fixtures explícitas de pruebas fuera de Vercel. No se crean anuncios ni se escriben datos en Supabase durante esta evolución.

El retrato oficial se conserva en la presentación de Thony. La experiencia «Mi próximo espacio» prepara una búsqueda por intención, zona, presupuesto y plazo, que el visitante puede compartir por WhatsApp. Se conservan filtros, galerías, inventario real y autenticación. El panel gestiona también textos, marca, imágenes, orden y visibilidad de secciones y SEO, con borradores privados, vista previa e historial. Ver [administración y validación](docs/CLAUDE-ADMIN-REVIEW.md), [Alberobello](docs/ALBEROBELLO.md) y [marca](docs/BRAND.md).

## Activar la administración de toda la web

El panel existente conserva sus propiedades y usuarios. La ampliación requiere ejecutar **una vez** [supabase/migrations/20261018_site_editor.sql](supabase/migrations/20261018_site_editor.sql) en **SQL Editor del proyecto Supabase existente**. Es aditiva e idempotente: no borra inventario ni cuentas. Añade publicación, borradores e historial separados y comprueba las políticas del almacén de archivos.

- `/admin`: crear, editar, publicar y borrar propiedades.
- `/admin/web`: textos, contactos, menú, portada, presentación, catálogo, búsqueda personal, pasos, pie y SEO; elegir imágenes y logo, ordenar/ocultar secciones y ajustar la paleta.
- `/admin/archivos`: subir y reutilizar fotos y PDF. Los archivos compartidos se conservan al borrar una ficha.
- `/admin/configuracion`: diagnóstico de sesión, rol, almacenamiento y ampliación; descarga del SQL necesario.
- `/admin/vista-previa`: borrador privado, con previsualización en escritorio/móvil integrada en el editor.

**Guardar borrador** conserva la publicación anterior. **Publicar cambios** actualiza el contenido sin otro despliegue de código, archiva la versión anterior y regenera las páginas. Las revisiones detectan ediciones simultáneas; un conflicto conserva la edición local y ofrece descargarla para comparar. La visita pública solo puede leer la publicación; borradores e historial requieren rol de administrador.

Hasta instalar la ampliación, la web sigue usando la composición de Claude por defecto. El editor permite revisar cambios, pero indica que no puede guardarlos ni publicarlos. Sin una cuenta autorizada en `admin_users`, iniciar sesión no concede permiso para subir ni editar. No se usan claves `service_role`.

Las subidas pasan por `/api/admin/media` en el mismo dominio. Se verifica la sesión en el servidor, el rol y los bytes del archivo; se distingue sesión vencida, falta de permisos, bucket ausente, formato y tamaño. Hay progreso y reintento sin perder el formulario. Las fotos se reducen a 2400 px y hasta 3 MB, preservando PNG transparente; el PDF admite hasta 3 MB. HEIC debe exportarse a JPG. Los logotipos originales pueden incorporarse desde el panel en PNG o WebP con transparencia, sin recrear la marca.

## Contacto oficial

- Teléfono y WhatsApp: **829-404-5770**; llamadas a `+18294045770`.
- WhatsApp: `https://wa.me/18294045770`, con mensaje codificado y contexto de la ficha.
- Correo: `brokerthonypaulino@ramaldigroup.com`.
- Instagram: `@thonypaulino_ramaldi`.
- Facebook: Thony no tiene perfil; la web no muestra Facebook (confirmado por Yordi Lewis el 2026-10-18).

Los datos están centralizados en `src/lib/site.ts`. No se han inventado biografía, estadísticas, testimonios o credenciales profesionales.

## Tecnologías y arquitectura

Next.js **16.4.2** con App Router, React **19.3.1**, TypeScript estricto, Tailwind CSS 4, Motion, Lucide React y `next/image`. Inter variable local. Node 24 recomendado; Node 22 o superior requerido. PGlite es una dependencia exclusiva de desarrollo para comprobar el SQL y RLS con PostgreSQL embebido; no se incluye en el frontend ni reemplaza Supabase.

Los componentes de servidor generan la portada y las fichas publicadas en el panel `/admin` (Supabase). Los componentes de cliente gestionan filtros, menú y galería sin efectos de movimiento. Con Supabase desactivado el catálogo queda vacío. Las fixtures requieren `THONY_TEST_FIXTURES=1` al compilar y ejecutar las pruebas, sin `VERCEL_ENV`; nunca se activan en Vercel. No se añaden dependencias, GSAP, WebGL ni Three.js.

```text
src/
  app/
    (site)/page.tsx             Portada, presentación y contacto
    (site)/layout.tsx           Encabezado, pie y CSS cinematográfico público
    layout.tsx                  Metadatos y tipografía compartidos
    globals.css                 Identidad visual y adaptación responsive
    (site)/propiedades/[slug]/page.tsx  Fichas publicadas y rutas 404
    admin/                      Panel propio, login, fotos y publicación
    opengraph-image.tsx          Imagen social generada localmente
    robots.ts / sitemap.ts      Indexación sin fichas ficticias
  components/                   Navegación, catálogo, galería, puerta y profundidad
    cinematic.css               Capa visual del sitio, aislada del panel
  data/properties.ts            Datos, tipos y filtrado puro
  lib/site.ts                   Contacto, configuración y enlaces de WhatsApp
public/
  images/                       Retrato oficial y recursos documentados
  brand/README.md               Incorporación de logotipos originales
tests/                          Regresiones con fixtures aisladas
tests-public/                   Sitio sin fixtures y entrada del panel
docs/                           Memoria compartida y procedencia de recursos
.github/workflows/ci.yml         Validación automática de PR y main
```

## Instalación y ejecución

```bash
cd Thony-Ramaldi
node --version
npm ci
npm run dev
```

El servidor de desarrollo usa el puerto 3000. Para otro puerto: `npm run dev -- --port 3001`. No hacen falta secretos para esta fase.

En el entorno cloud de esta sesión, el directorio personal no permite escribir la caché de npm. Antes de instalar, ejecutar:

```bash
export npm_config_cache=/workspace/.cache/npm
cd /workspace/Thony-Ramaldi
npm ci --no-audit --no-fund
```

La configuración reutilizable del entorno conserva la instalación y sus comprobaciones; los procesos se deben iniciar de nuevo en cada tarea. Usar el checkout existente: cada tarea ya está aislada y no requiere un worktree adicional.

Detener el servidor propio antes de reinstalar dependencias. El script de nube conserva cualquier caché generada de desarrollo en un directorio temporal antes de instalar para que Turbopack no reutilice referencias antiguas. No mueve código fuente ni archivos de usuario. `next-env.d.ts` se genera mediante Next y queda ignorado.

## Variables de entorno públicas

Copiar `.env.example` a `.env.local` solo si se necesitan personalizaciones. El archivo de ejemplo no contiene secretos.

| Variable | Uso | Valor por defecto |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Dominio público HTTPS para canonical, Open Graph y sitemap | Se detecta a partir de `VERCEL_PROJECT_PRODUCTION_URL` o `VERCEL_URL`; sin dominio configurado se utiliza una base local de desarrollo y sitemap vacío |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase para el panel `/admin` | Proyecto oficial (`uowylfdlirlfqksvdeer`) definido en `src/lib/supabase/env.ts`; vacía desactiva Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública (publishable) de Supabase | La del proyecto oficial; vacía desactiva Supabase |

Estas variables son públicas y se leen al compilar. No colocar contraseñas, tokens o claves en ellas. En un despliegue fuera de Vercel, definir el dominio público antes de compilar. Los contactos oficiales tienen valores públicos en `site.ts` y no necesitan variables.

## Funcionalidades actuales

- Portada de Claude con profundidad por capas y aviso ilustrativo; retrato oficial en presentación y entrada, carrusel cuando hay propiedades publicadas y firma grande al pie. El pie espera fotografías del inventario público en lugar de usar una imagen ilustrativa.
- Header fijo y menú de las tres rayas a pantalla completa en todos los tamaños, independiente de las animaciones y el desenfoque de la cabecera. Conserva todas las opciones al desplazarse o redimensionar, sin desbordamiento horizontal; las ventanas bajas permiten desplazamiento vertical. Control de foco, Escape y navegación de respaldo cuando JavaScript está desactivado.
- Entrada directa a la portada, sin preloader ni espera decorativa. Las fotos lentas o fallidas no bloquean el contenido, el menú ni el teclado. Las configuraciones antiguas se normalizan a presentación estática; historial en [PRELOADER](docs/PRELOADER.md).
- Catálogo publicado, selección de destacados y filtros combinados por tipo, operación, ubicación, precio máximo y mínimo de habitaciones. El alquiler muestra precio mensual; al cambiar operación se restablece el filtro de precio para evitar mezclar rangos. Los importes provisionales y datos desconocidos no satisfacen filtros numéricos.
- Estado sin resultados y limpieza de filtros.
- Fichas con galería, miniaturas, ampliación, teclado, gestos, recuperación de imágenes y consulta contextual de WhatsApp. Las demostraciones se identifican como ficticias; Alberobello solicita confirmar renta, unidad y fotos actuales.
- Presentación profesional de Thony y enlaces de llamada, correo, Instagram y WhatsApp.
- Presentación estática para todos los visitantes, también al pasar el cursor o cambiar las preferencias de movimiento. El editor no reactiva efectos desde publicaciones o versiones antiguas.
- Imágenes optimizadas con Next, carga diferida, tipografías locales, foco visible y estructura semántica.
- Metadatos sociales y SEO. Las fichas de demostración llevan `noindex` y no están en el sitemap.

La galería avisa que las fotografías ilustrativas no representan un mismo inmueble. No se muestran coordenadas, mapas, recorridos virtuales ni inventario real inexistente.

## Panel de propiedades (`/admin`)

Panel propio, en español, construido en la aplicación (`src/app/admin/`). Los datos, las fotos y el inicio de sesión viven en **Supabase** (Postgres, Storage y Auth). Las páginas públicas obtienen las propiedades con `getProperties()` (`src/data/get-properties.ts`):

- **Proyecto oficial**: `uowylfdlirlfqksvdeer`, con URL y clave publishable como valores por defecto en `src/lib/supabase/env.ts` (no hace falta configurar Vercel).
- **La web muestra solo lo publicado en el panel.** Sin fichas publicadas, el catálogo muestra “Pronto publicaremos nuevas propiedades” con contacto por WhatsApp y el carrusel se oculta. El modo y su snapshot se verifican por petición. Si Supabase no responde, se muestra un error; no se publica un catálogo vacío ni otra identidad como sustitución. Esta ampliación usa renderizado dinámico, sin prometer el respaldo de HTML de la versión ISR anterior.
- **Desactivado** (variables vacías): `/admin` muestra “Panel pendiente de activar” y el catálogo queda vacío. Solo pruebas fuera de Vercel que habiliten `THONY_TEST_FIXTURES=1` usan `sampleProperties`. Las demostraciones tampoco se leen del panel para la web pública.
- **Configurado**: `/admin` pide correo y contraseña (`src/proxy.ts` protege todas sus rutas). Thony crea, edita, oculta y borra fichas; las fotos se reducen en el navegador (máx. 2400 px) y pasan por el servidor con validación antes de guardarse en `properties`. Guardar invalida las rutas (`revalidatePath`); cada petición pública verifica el modo y su contenido. Las fichas nuevas se sirven bajo demanda.
- El panel vacío ofrece **Crear propiedad**; las fichas se añaden manualmente con sus datos y fotos. El botón y la acción de importar Alberobello se retiraron por petición del propietario.

Seguridad (`supabase/schema.sql`): lectura pública solo de fichas publicadas; crear, editar, borrar y subir archivos solo para correos de la tabla `admin_users`. La clave del navegador es pública por diseño; nunca usar ni guardar la clave `service_role` en el proyecto.

Cada propiedad tiene un estado: **Demostración**, **Ficha en preparación** (como Alberobello) o **Disponible**. Los textos de fichas, tarjetas, carrusel, catálogo y WhatsApp se adaptan a cada estado. Las ubicaciones del filtro se derivan de los datos.

Activación pendiente:

1. Proyecto creado: `uowylfdlirlfqksvdeer`.
2. En **SQL Editor**, pegar y ejecutar `supabase/schema.sql`, cambiando antes el correo de la última línea por el de Thony.
3. En **Authentication → Users → Add user**, crear el usuario de Thony con ese correo y una contraseña. En **Authentication → Sign In / Providers**, desactivar *Allow new users to sign up*.
4. URL y clave publishable ya están en `src/lib/supabase/env.ts`. Para otro proyecto, cambiarlas allí o definir `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Vercel y volver a desplegar.
5. Entrar en `/admin` y crear/publicar las fichas autorizadas desde **Nueva propiedad**.

Nota del plan gratuito: Supabase pausa los proyectos sin actividad durante una semana. Las visitas a la web cuentan como actividad; si se pausara, la lectura dinámica de esta ampliación requeriría que el propietario lo reactive. No se cambia de identidad para ocultar una interrupción del servicio.

## Identidad y recursos pendientes

Se recibieron dos referencias del logo Ramaldi en la conversación y se usaron para acentos de marca. Falta un archivo reutilizable de logo en el checkout. El retrato de Thony (`public/images/thony-paulino.jpg`, `site.portrait`) se usa en “Sobre Thony” y en la tarjeta de consulta de cada ficha. El encabezado utiliza identidad tipográfica provisional, sin inventar un logotipo corporativo. Incorporar los recursos autorizados según `public/brand/README.md`, desde Imágenes y logo del panel.

La presentación del servicio es una propuesta editorial que el propietario puede revisar; no pretende ser una biografía verificada. Incorporar contenido e inventario aprobados antes de un lanzamiento comercial. Procedencia y condiciones pendientes de las fotografías: [docs/ASSETS.md](docs/ASSETS.md).

| Uso | Variable CSS | Valor |
| --- | --- | --- |
| Fondo carbón de Claude | `--bg` | `#2B2B2B` |
| Texto | `--text` | `#FFFFFF` |
| Verde de referencia | `--petroleum` | `#437976` |
| CTA verde profundo | `--petroleum-deep` | `#285651` |
| Texto verde claro sobre carbón | `--brand-ink` | `#ACD7CF` |
| Dorado de referencia / claro | `--gold` / `--gold-light` | `#DEA900` / `#F5E8B3` |

Los colores de marca se aproximan visualmente al logo aportado, sin sustituir el tema oscuro. No son códigos corporativos certificados. La referencia Maddock se inspeccionó en las sesiones previas; no se copiaron sus recursos. Procedencia en ASSETS y resultados actuales en AUDIT-INTEGRATION.

## Comprobaciones

```bash
npm run lint
npm run typecheck
THONY_TEST_FIXTURES=1 NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= npm run build
npx playwright install chromium
npm test
```

Las regresiones usan una compilación con Supabase desactivado y fixtures explícitas. Playwright pasa el mismo flag al servidor; ninguna prueba crea propiedades en el proyecto real. Para comprobar el sitio sin fixtures:

```bash
THONY_TEST_FIXTURES= NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= npm run build
CI=true npx playwright test --config=playwright.public.config.ts
```

La CI comprueba ambos modos. Nunca configurar el flag de fixtures en Vercel.

Si ya existe `/usr/bin/chromium`, la configuración de Playwright lo utiliza y no hace falta descargar otro navegador. En Linux, si faltan bibliotecas del sistema, la instalación oficial de Playwright permite `npx playwright install --with-deps chromium`. La CI usa ese procedimiento.

`npm test` inicia el servidor **de producción previamente compilado** en el puerto 3100 y ejecuta Chromium en escritorio y móvil. Comprueba imágenes y consola, contactos, filtros combinados, alquiler, ausencia de resultados, destacados, las siete rutas, 404, galerías, foco, menú, tamaños 360/390/768/844/1440 px, accesibilidad con axe, entrada directa sin overlay, ausencia de movimiento y renderizado sin JavaScript. El menú completo se comprueba en ambos tamaños; ya no corresponde omitirlo en escritorio. La suite combinada añade clasificación del carrusel, precio provisional, datos null y verificación del PDF original. No reutilizar un servidor antiguo al probar otra compilación; `CI=true npm test` exige un puerto libre y arranca uno nuevo.

Las pruebas de entrada incluyen llegada por una ficha y retorno SPA, carga lenta, error y teclado sin overlay. Se verifica que fotos y controles permanezcan estáticos al mover el puntero o desplazarse y que no haya animaciones activas. Los informes de profundidad anteriores pertenecen a versiones históricas.

El reporte HTML queda en `playwright-report/` y los fallos en `test-results/`, ambos ignorados por Git. Resultados reales y límites de la entrega en [HANDOFF](docs/HANDOFF.md). No se consideran medidas las Core Web Vitals de usuarios reales ni el comportamiento de Safari o dispositivos físicos por haber pasado Chromium.

Producción local:

```bash
npm run build
npm run start
```

## Pruebas del editor y el almacenamiento

```bash
npm run test:database
npm run test:admin
```

La primera ejecuta el esquema y la migración reales con PostgreSQL embebido y comprueba RLS, borradores, publicación, historial y conflictos. La segunda crea un doble HTTP en loopback para Auth, PostgREST y Storage, compila en ese modo y comprueba las pantallas, cookies, subidas, errores, permisos y publicación. No se conecta al proyecto real. Los flags del doble se bloquean con `VERCEL_ENV`; no configurarlos en Vercel. La suite reemplaza `.next`, por lo que se debe recompilar para ejecutar después las regresiones con fixtures o el servidor normal.

El optimizador conserva su protección contra IP privadas. En las pruebas de navegador del doble, solo sus miniaturas se sustituyen por el JPEG conocido de prueba; las suites públicas comprueban la carga normal de imágenes. El reporte del panel queda en `playwright-report-admin/`, ignorado por Git y ESLint.

## Publicación en Vercel

El repositorio oficial `JordyGomez/Thony-Ramaldi` ya está conectado al proyecto [thony-ramaldi de Vercel](https://vercel.com/los-yordis/thony-ramaldi). La integración GitHub existente genera los despliegues; no hace falta importar otro proyecto ni añadir tokens de Vercel al repositorio.

1. Guardar cambios en commits y subir la rama a GitHub; abrir su PR contra `main`. Esta entrega utiliza `feat/claude-design-full-admin`, basada en main `3adaf47` (PR #6).
2. GitHub Actions ejecuta instalación, lint, tipos, build y pruebas de navegador. Vercel compila una **Preview** y añade el enlace al PR. Nuevos commits en la rama actualizan esa preview automáticamente. Si Vercel pide iniciar sesión, acceder con una cuenta autorizada del equipo.
3. Revisar la preview y los checks del PR. Para actualizar el sitio público, pulsar **Merge pull request** y confirmar la fusión a `main` en GitHub.
4. Vercel despliega automáticamente el nuevo `main` en [thony-ramaldi.vercel.app](https://thony-ramaldi.vercel.app/). Comprobar el resultado del despliegue y el sitio antes de darlo por publicado.

**Guardar/publicar la configuración del entorno cloud configura las tareas de Codex; no fusiona el PR de la aplicación.** La actualización de producción se activa cuando los cambios llegan a `main`. El PR #2 anterior corresponde a otra rama y no contiene esta integración.

Se conserva Next.js como framework, raíz del repositorio, instalación con `npm ci`, build con `npm run build` y salida predeterminada. `NEXT_PUBLIC_SITE_URL` permite reemplazar la detección del dominio de Vercel; no hacen falta credenciales de una base de datos. Antes del lanzamiento comercial, confirmar los datos provisionales de Alberobello, fotografías, recursos de marca y contenido con el propietario. El propietario autorizó llevar esta entrega a main tras las comprobaciones; esa integración activa producción. Los cambios de contenido posteriores se publican desde el editor, sin otro despliegue de código.

## Convenciones y colaboración

Usar TypeScript estricto, componentes reutilizables, configuración de contacto centralizada y datos separados de las integraciones futuras. Mantener la jerarquía visual, etiquetas accesibles y las advertencias de demostración. Evitar dependencias redundantes.

**Yordi Gómez / Codex y Yordi Lewis / Claude pueden modificar cualquier archivo.** No existen carpetas exclusivas ni propietarios permanentes. Al iniciar cada prompt, consultar el remoto, comparar commits y leer los documentos antes de editar; repetir la revisión al cerrar. No sobrescribir cambios desconocidos, forzar pushes ni inventar atribuciones. Los cambios no publicados de otra persona no son visibles.

- [AGENTS.md](AGENTS.md): reglas comunes y procedimiento de seguridad Git.
- [CLAUDE.md](CLAUDE.md): inicio de tarea para Claude.
- [docs/CHANGELOG.md](docs/CHANGELOG.md): cambios reales y pruebas.
- [docs/HANDOFF.md](docs/HANDOFF.md): estado y siguiente tarea.
- [docs/ROADMAP.md](docs/ROADMAP.md): fases terminadas, planificadas e ideas pendientes.

Antes de continuar: revisar esos documentos, obtener información reciente de GitHub, comprender el código afectado, implementar solo el alcance autorizado, validar y actualizar la memoria compartida. No construir aún un motor 3D: el modelo de datos solo admite una referencia opcional a un futuro recurso `glb`/`gltf` con procedencia identificada.

# Thony Paulino · Ramaldi

Sitio profesional y catálogo inmobiliario de **Thony Paulino**, asesor de **Ramaldi**, orientado a República Dominicana. Conserva la dirección oscura de Claude, Inter fina y consultas directas. La evolución cinematográfica utiliza arquitectura de marca en CSS y el retrato oficial autorizado, sin representar viviendas que no estén comercializadas.

La web pública obtiene **solo propiedades publicadas y no marcadas como demostración en Supabase**. Sin inventario, muestra una selección en preparación y contacto por WhatsApp o teléfono. Los datos locales de ejemplo son fixtures explícitas de pruebas fuera de Vercel. No se crean anuncios ni se escriben datos en Supabase durante esta evolución.

La entrada 3D revela el retrato real y se coordina con el hero. Se conservan filtros, galerías accesibles, consultas contextuales, panel `/admin`, autenticación y políticas de Supabase. Ver [revisión actual](docs/CINEMATIC-REVIEW.md), [preloader](docs/PRELOADER.md), [Alberobello](docs/ALBEROBELLO.md) y [marca](docs/BRAND.md). Rama de entrega: `feat/cinematic-ramaldi-experience`, desde main `0742704` (PR #5).

## Contacto oficial

- Teléfono y WhatsApp: **829-404-5770**; llamadas a `+18294045770`.
- WhatsApp: `https://wa.me/18294045770`, con mensaje codificado y contexto de la ficha.
- Correo: `brokerthonypaulino@ramaldigroup.com`.
- Instagram: `@thonypaulino_ramaldi`.
- Facebook: Thony no tiene perfil; la web no muestra Facebook (confirmado por Yordi Lewis el 2026-10-18).

Los datos están centralizados en `src/lib/site.ts`. No se han inventado biografía, estadísticas, testimonios o credenciales profesionales.

## Tecnologías y arquitectura

Next.js **16.4.2** con App Router, React **19.3.1**, TypeScript estricto, Tailwind CSS 4, un sistema visual en CSS, Motion para revelados, Lucide React y `next/image`. Tipografía Inter (variable) servida localmente mediante Fontsource. Node 24 recomendado; Node 22 o superior requerido.

Los componentes de servidor generan la portada y las fichas publicadas en el panel `/admin` (Supabase). Los componentes de cliente gestionan filtros, menú, galería y animaciones. Con Supabase desactivado el catálogo queda vacío. Las fixtures requieren `THONY_TEST_FIXTURES=1` al compilar y ejecutar las pruebas, sin `VERCEL_ENV`; nunca se activan en Vercel. No se añaden dependencias, GSAP, WebGL ni Three.js.

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

- Portada con arquitectura CSS y retrato oficial, paleta carbón/verde con acentos Ramaldi; carrusel cuando hay propiedades publicadas y pie con el nombre a todo el ancho y composición de marca.
- Header fijo, menú completo en todos los tamaños, control de foco y cierre con Escape.
- Entrada con hoja sólida, marco, espesor, tirador y retrato real. Una vez por sesión y solo al abrir inicialmente la home; 2,1 s en carga normal y máximo 5 s si el contenido crítico tarda. Se puede saltar al interactuar, se omite con movimiento reducido y no bloquea contenido sin JavaScript. Lógica en [PRELOADER](docs/PRELOADER.md).
- Catálogo publicado, selección de destacados y filtros combinados por tipo, operación, ubicación, precio máximo y mínimo de habitaciones. El alquiler muestra precio mensual; al cambiar operación se restablece el filtro de precio para evitar mezclar rangos. Los importes provisionales y datos desconocidos no satisfacen filtros numéricos.
- Estado sin resultados y limpieza de filtros.
- Fichas con galería, miniaturas, ampliación, teclado, gestos, recuperación de imágenes y consulta contextual de WhatsApp. Las demostraciones se identifican como ficticias; Alberobello solicita confirmar renta, unidad y fotos actuales.
- Presentación profesional de Thony y enlaces de llamada, correo, Instagram y WhatsApp.
- Transiciones de interfaz y revelados de scroll respetando `prefers-reduced-motion`.
- Imágenes optimizadas con Next, carga diferida, tipografías locales, foco visible y estructura semántica.
- Metadatos sociales y SEO. Las fichas de demostración llevan `noindex` y no están en el sitemap.

La galería avisa que las fotografías ilustrativas no representan un mismo inmueble. No se muestran coordenadas, mapas, recorridos virtuales ni inventario real inexistente.

## Panel de propiedades (`/admin`)

Panel propio, en español, construido en la aplicación (`src/app/admin/`). Los datos, las fotos y el inicio de sesión viven en **Supabase** (Postgres, Storage y Auth). Las páginas públicas obtienen las propiedades con `getProperties()` (`src/data/get-properties.ts`):

- **Proyecto oficial**: `uowylfdlirlfqksvdeer`, con URL y clave publishable como valores por defecto en `src/lib/supabase/env.ts` (no hace falta configurar Vercel).
- **La web muestra solo lo publicado en el panel.** Sin fichas publicadas, el catálogo muestra “Pronto publicaremos nuevas propiedades” con contacto por WhatsApp y el carrusel se oculta. Si Supabase falla, la página lanza un error y Next conserva la última versión publicada (en un build, el despliegue falla en lugar de publicar una web vacía).
- **Desactivado** (variables vacías): `/admin` muestra “Panel pendiente de activar” y el catálogo queda vacío. Solo pruebas fuera de Vercel que habiliten `THONY_TEST_FIXTURES=1` usan `sampleProperties`. Las demostraciones tampoco se leen del panel para la web pública.
- **Configurado**: `/admin` pide correo y contraseña (`src/proxy.ts` protege todas sus rutas). Thony crea, edita, oculta y borra fichas; las fotos se reducen en el navegador (máx. 2400 px) y se suben directamente al bucket `properties`. Guardar regenera la web al instante (`revalidatePath`); como respaldo, las páginas se revalidan cada 60 s. Las fichas nuevas se generan bajo demanda.
- El panel vacío ofrece **Importar Alberobello**, que copia esa ficha real con sus renders y su folleto. Las seis demostraciones ficticias no se importan.

Seguridad (`supabase/schema.sql`): lectura pública solo de fichas publicadas; crear, editar, borrar y subir archivos solo para correos de la tabla `admin_users`. La clave del navegador es pública por diseño; nunca usar ni guardar la clave `service_role` en el proyecto.

Cada propiedad tiene un estado: **Demostración**, **Ficha en preparación** (como Alberobello) o **Disponible**. Los textos de fichas, tarjetas, carrusel, catálogo y WhatsApp se adaptan a cada estado. Las ubicaciones del filtro se derivan de los datos.

Activación pendiente:

1. Proyecto creado: `uowylfdlirlfqksvdeer`.
2. En **SQL Editor**, pegar y ejecutar `supabase/schema.sql`, cambiando antes el correo de la última línea por el de Thony.
3. En **Authentication → Users → Add user**, crear el usuario de Thony con ese correo y una contraseña. En **Authentication → Sign In / Providers**, desactivar *Allow new users to sign up*.
4. URL y clave publishable ya están en `src/lib/supabase/env.ts`. Para otro proyecto, cambiarlas allí o definir `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Vercel y volver a desplegar.
5. Entrar en `/admin`, pulsar **Importar Alberobello** (opcional) y publicar las demás propiedades desde **Nueva propiedad**.

Nota del plan gratuito: Supabase pausa los proyectos sin actividad durante una semana. Las visitas a la web cuentan como actividad; si se pausara, las páginas seguirían mostrando su última versión generada hasta reactivarlo desde su panel.

## Identidad y recursos pendientes

Se recibieron dos referencias del logo Ramaldi en la conversación y se usaron para acentos de marca. Falta un archivo reutilizable de logo en el checkout. El retrato de Thony (`public/images/thony-paulino.jpg`, `site.portrait`) se usa en “Sobre Thony” y en la tarjeta de consulta de cada ficha. El encabezado utiliza identidad tipográfica provisional, sin inventar un logotipo corporativo. Incorporar los recursos autorizados según `public/brand/README.md`, configurando `site.logo`.

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

`npm test` inicia el servidor **de producción previamente compilado** en el puerto 3100 y ejecuta Chromium en escritorio y móvil. Comprueba imágenes y consola, contactos, filtros combinados, alquiler, ausencia de resultados, destacados, las siete rutas, 404, galerías, foco, menú, tamaños 360/390/768/844/1440 px, accesibilidad con axe, entrada por sesión, movimiento reducido y renderizado sin JavaScript. El menú completo se comprueba en ambos tamaños; ya no corresponde omitirlo en escritorio. La suite combinada añade clasificación del carrusel, precio provisional, datos null y verificación del PDF original. No reutilizar un servidor antiguo al probar otra compilación; `CI=true npm test` exige un puerto libre y arranca uno nuevo.

Las pruebas del preloader incluyen llegada por una ficha y retorno SPA, carga lenta, error, límite y teclado. La evolución añade retrato real, relevo al hero y profundidad desactivada fuera de pantalla, con ahorro de datos o movimiento reducido. Resultados actuales en CINEMATIC-REVIEW.

El reporte HTML queda en `playwright-report/` y los fallos en `test-results/`, ambos ignorados por Git. Resultados reales y límites de la entrega en [HANDOFF](docs/HANDOFF.md). No se consideran medidas las Core Web Vitals de usuarios reales ni el comportamiento de Safari o dispositivos físicos por haber pasado Chromium.

Producción local:

```bash
npm run build
npm run start
```

## Publicación en Vercel

El repositorio oficial `JordyGomez/Thony-Ramaldi` ya está conectado al proyecto [thony-ramaldi de Vercel](https://vercel.com/los-yordis/thony-ramaldi). La integración GitHub existente genera los despliegues; no hace falta importar otro proyecto ni añadir tokens de Vercel al repositorio.

1. Guardar cambios en commits y subir la rama a GitHub; abrir su PR contra `main`. Esta entrega utiliza `feat/cinematic-ramaldi-experience`, basada en el main del PR #5 de Claude.
2. GitHub Actions ejecuta instalación, lint, tipos, build y pruebas de navegador. Vercel compila una **Preview** y añade el enlace al PR. Nuevos commits en la rama actualizan esa preview automáticamente. Si Vercel pide iniciar sesión, acceder con una cuenta autorizada del equipo.
3. Revisar la preview y los checks del PR. Para actualizar el sitio público, pulsar **Merge pull request** y confirmar la fusión a `main` en GitHub.
4. Vercel despliega automáticamente el nuevo `main` en [thony-ramaldi.vercel.app](https://thony-ramaldi.vercel.app/). Comprobar el resultado del despliegue y el sitio antes de darlo por publicado.

**Guardar/publicar la configuración del entorno cloud configura las tareas de Codex; no fusiona el PR de la aplicación.** La actualización de producción se activa cuando los cambios llegan a `main`. El PR #2 anterior corresponde a otra rama y no contiene esta integración.

Se conserva Next.js como framework, raíz del repositorio, instalación con `npm ci`, build con `npm run build` y salida predeterminada. `NEXT_PUBLIC_SITE_URL` permite reemplazar la detección del dominio de Vercel; no hacen falta credenciales de una base de datos. Antes del lanzamiento comercial, confirmar los datos provisionales de Alberobello, fotografías, recursos de marca y contenido con el propietario. Esta tarea publica una rama y su PR para revisión; no fusiona automáticamente a producción.

## Convenciones y colaboración

Usar TypeScript estricto, componentes reutilizables, configuración de contacto centralizada y datos separados de las integraciones futuras. Mantener la jerarquía visual, etiquetas accesibles y las advertencias de demostración. Evitar dependencias redundantes.

**Yordi Gómez / Codex y Yordi Lewis / Claude pueden modificar cualquier archivo.** No existen carpetas exclusivas ni propietarios permanentes. Al iniciar cada prompt, consultar el remoto, comparar commits y leer los documentos antes de editar; repetir la revisión al cerrar. No sobrescribir cambios desconocidos, forzar pushes ni inventar atribuciones. Los cambios no publicados de otra persona no son visibles.

- [AGENTS.md](AGENTS.md): reglas comunes y procedimiento de seguridad Git.
- [CLAUDE.md](CLAUDE.md): inicio de tarea para Claude.
- [docs/CHANGELOG.md](docs/CHANGELOG.md): cambios reales y pruebas.
- [docs/HANDOFF.md](docs/HANDOFF.md): estado y siguiente tarea.
- [docs/ROADMAP.md](docs/ROADMAP.md): fases terminadas, planificadas e ideas pendientes.

Antes de continuar: revisar esos documentos, obtener información reciente de GitHub, comprender el código afectado, implementar solo el alcance autorizado, validar y actualizar la memoria compartida. No construir aún un motor 3D: el modelo de datos solo admite una referencia opcional a un futuro recurso `glb`/`gltf` con procedencia identificada.

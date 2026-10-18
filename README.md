# Thony Paulino · Ramaldi

Primera versión del portafolio profesional y catálogo inmobiliario de **Thony Paulino**, asesor de **Ramaldi**, orientada a República Dominicana. La experiencia combina composición editorial, fotografía ilustrativa, una entrada de puerta CSS 3D y consultas directas al asesor.

Todos los inmuebles de esta entrega son **DEMOSTRACIÓN**: nombres, precios, características y ubicaciones son ficticios. No constituyen anuncios ni ofertas reales. Los contactos sí son los proporcionados por el propietario.

## Contacto oficial

- Teléfono y WhatsApp: **829-404-5770**; llamadas a `+18294045770`.
- WhatsApp: `https://wa.me/18294045770`, con mensaje codificado y contexto de la ficha.
- Correo: `brokerthonypaulino@ramaldigroup.com`.
- Instagram: `@thonypaulino_ramaldi`.
- Facebook: **Thony Paulino**, URL exacta pendiente; no se inventa un perfil.

Los datos están centralizados en `src/lib/site.ts`. No se han inventado biografía, estadísticas, testimonios o credenciales profesionales.

## Tecnologías y arquitectura

Next.js **16.4.2** con App Router, React **19.3.1**, TypeScript estricto, Tailwind CSS 4, un sistema visual en CSS, Motion para revelados, Lucide React y `next/image`. Tipografías Manrope y Cormorant Garamond servidas localmente mediante Fontsource. Node 24 recomendado; Node 22 o superior requerido.

Los componentes de servidor generan la portada y las seis fichas. Los componentes de cliente gestionan filtros, menú, galería y animaciones. El catálogo utiliza datos locales tipados; no hay API, base de datos, autenticación ni servicios comerciales necesarios para ejecutar la aplicación. No se ha añadido GSAP ni Three.js porque esta fase no los necesita.

```text
src/
  app/
    page.tsx                    Portada, presentación y contacto
    layout.tsx                  Metadatos, tipografías, encabezado y pie
    globals.css                 Identidad visual y adaptación responsive
    propiedades/[slug]/page.tsx  Seis fichas estáticas y rutas 404
    error.tsx / not-found.tsx    Recuperación y navegación de error
    opengraph-image.tsx          Imagen social generada localmente
    robots.ts / sitemap.ts      Indexación sin fichas ficticias
  components/                   Navegación, catálogo, tarjetas, galería y animación
  data/properties.ts            Datos, tipos y filtrado puro
  lib/site.ts                   Contacto, configuración y enlaces de WhatsApp
public/
  images/                       Fotografías ilustrativas locales
  brand/README.md               Incorporación de logotipos originales
tests/site.spec.ts              Pruebas de navegador y accesibilidad
docs/                           Memoria compartida y procedencia de recursos
.github/workflows/ci.yml         Validación propuesta para GitHub Actions
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
| `NEXT_PUBLIC_FACEBOOK_URL` | URL HTTPS confirmada de `facebook.com` | Vacío: muestra “Enlace por confirmar”, sin botón falso |

Estas variables son públicas y se leen al compilar. No colocar contraseñas, tokens o claves en ellas. En un despliegue fuera de Vercel, definir el dominio público antes de compilar. Los contactos oficiales tienen valores públicos en `site.ts` y no necesitan variables.

## Funcionalidades de la fase 1

- Portada editorial, paleta petróleo/marfil/dorado y hero con fotografía ilustrativa.
- Header sticky, navegación móvil, control de foco y cierre con Escape.
- Puerta CSS con perspectiva, duración máxima de 2,3 s y una reproducción por sesión; omitida con movimiento reducido. No muestra porcentajes ficticios ni impide acceder al contenido si falla JavaScript.
- Catálogo de seis fichas de demostración, selección de destacados y filtros combinados por tipo, operación, ubicación, precio máximo y mínimo de habitaciones. El alquiler muestra precio mensual; al cambiar operación se restablece el filtro de precio para evitar mezclar rangos.
- Estado sin resultados y limpieza de filtros.
- Fichas con galería, miniaturas, ampliación, navegación por teclado, características, precio y consulta contextual de WhatsApp, que reconoce que la ficha es ficticia.
- Presentación profesional de Thony y enlaces de llamada, correo, Instagram y WhatsApp.
- Transiciones de interfaz y revelados de scroll respetando `prefers-reduced-motion`.
- Imágenes optimizadas con Next, carga diferida, tipografías locales, foco visible y estructura semántica.
- Metadatos sociales y SEO. Las fichas de demostración llevan `noindex` y no están en el sitemap.

La galería avisa que las fotografías ilustrativas no representan un mismo inmueble. No se muestran coordenadas, mapas, recorridos virtuales ni inventario real inexistente.

## Identidad y recursos pendientes

Los dos logotipos originales y el retrato de Thony **no se recibieron en esta sesión**. El encabezado utiliza identidad tipográfica provisional, sin inventar un logotipo corporativo. Incorporar los recursos autorizados según `public/brand/README.md`, configurando `site.logo` y `site.portrait`.

La presentación del servicio es una propuesta editorial que el propietario puede revisar; no pretende ser una biografía verificada. Incorporar contenido e inventario aprobados antes de un lanzamiento comercial. Procedencia y condiciones pendientes de las fotografías: [docs/ASSETS.md](docs/ASSETS.md).

| Color | Variable CSS | Valor aproximado |
| --- | --- | --- |
| Petróleo | `--petroleum` | `#477D79` |
| Petróleo profundo para contraste | `--petroleum-deep` | `#285651` |
| Dorado | `--gold` | `#D99A00` |
| Dorado claro | `--gold-light` | `#F0CA55` |
| Marfil | `--ivory` | `#F8F6F0` |
| Carbón | `--charcoal` | `#192B2B` |
| Blanco | `--white` | `#FFFFFF` |

Son aproximaciones proporcionadas en el brief, no códigos certificados de Ramaldi. No se utilizó ninguna web externa como referencia corporativa. La referencia estética Maddock no pudo capturarse: el entorno respondió HTTP 403.

## Comprobaciones

```bash
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm test
```

Si ya existe `/usr/bin/chromium`, la configuración de Playwright lo utiliza y no hace falta descargar otro navegador. En Linux, si faltan bibliotecas del sistema, la instalación oficial de Playwright permite `npx playwright install --with-deps chromium`. La CI usa ese procedimiento.

`npm test` inicia el servidor **de producción previamente compilado** en el puerto 3100 y ejecuta Chromium en escritorio y móvil. Comprueba imágenes y consola, contactos, filtros combinados, alquiler, ausencia de resultados, destacados, las seis rutas, 404, galerías, foco, menú, tamaños 360/390/768/844/1440 px, accesibilidad con axe, entrada por sesión, movimiento reducido y renderizado sin JavaScript. El caso específico de menú móvil se omite en el proyecto de escritorio por no aplicar. No reutilizar un servidor antiguo al probar otra compilación; `CI=true npm test` exige un puerto libre y arranca uno nuevo.

El reporte HTML queda en `playwright-report/` y los fallos en `test-results/`, ambos ignorados por Git. Resultados reales y límites de la entrega en [HANDOFF](docs/HANDOFF.md). No se consideran medidas las Core Web Vitals de usuarios reales ni el comportamiento de Safari o dispositivos físicos por haber pasado Chromium.

Producción local:

```bash
npm run build
npm run start
```

## Despliegue posterior en Vercel

1. Importar **el único repositorio oficial**, `JordyGomez/Thony-Ramaldi`, en Vercel.
2. Seleccionar Next.js, raíz del repositorio y Node 24. Instalar con `npm ci`; compilar con `npm run build`; mantener el directorio de salida predeterminado.
3. Definir el dominio público en `NEXT_PUBLIC_SITE_URL` si se necesita reemplazar la detección automática de Vercel. Añadir Facebook únicamente después de confirmar su URL. No hacen falta credenciales de una base de datos.
4. Habilitar Preview Deployments para ramas/PR y revisar móvil, contactos, fotografías y metadatos en la preview.
5. Incorporar activos y datos autorizados, confirmar derechos de las fotografías, medir rendimiento en el despliegue y obtener autorización antes de publicar producción.

No se ha desplegado automáticamente ni conectado una cuenta de Vercel desde esta sesión. El workflow de GitHub Actions se añade como configuración; sus resultados remotos deben comprobarse cuando la rama se publique.

## Convenciones y colaboración

Usar TypeScript estricto, componentes reutilizables, configuración de contacto centralizada y datos separados de las integraciones futuras. Mantener la jerarquía visual, etiquetas accesibles y las advertencias de demostración. Evitar dependencias redundantes.

**Yordi Gómez / Codex y Yordi Lewis / Claude pueden modificar cualquier archivo.** No existen carpetas exclusivas ni propietarios permanentes. Al iniciar cada prompt, consultar el remoto, comparar commits y leer los documentos antes de editar; repetir la revisión al cerrar. No sobrescribir cambios desconocidos, forzar pushes ni inventar atribuciones. Los cambios no publicados de otra persona no son visibles.

- [AGENTS.md](AGENTS.md): reglas comunes y procedimiento de seguridad Git.
- [CLAUDE.md](CLAUDE.md): inicio de tarea para Claude.
- [docs/CHANGELOG.md](docs/CHANGELOG.md): cambios reales y pruebas.
- [docs/HANDOFF.md](docs/HANDOFF.md): estado y siguiente tarea.
- [docs/ROADMAP.md](docs/ROADMAP.md): fases terminadas, planificadas e ideas pendientes.

Antes de continuar: revisar esos documentos, obtener información reciente de GitHub, comprender el código afectado, implementar solo el alcance autorizado, validar y actualizar la memoria compartida. No construir aún un motor 3D: el modelo de datos solo admite una referencia opcional a un futuro recurso `glb`/`gltf` con procedencia identificada.

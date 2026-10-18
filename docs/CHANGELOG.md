# Registro de cambios

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

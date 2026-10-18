# Reglas de colaboración — Thony Ramaldi

## Un producto compartido

Yordi Gómez trabaja con Codex y Yordi Lewis con Claude. Ambos pueden modificar cualquier archivo. No existen carpetas, propietarios permanentes ni responsabilidades exclusivas por asistente. Git es la fuente de verdad; la documentación explica el contexto.

## Al iniciar cada tarea o retomar una interrupción

1. Leer `README.md`, este archivo, `CLAUDE.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md` y `docs/ROADMAP.md`.
2. Confirmar que el checkout corresponde a `github.com/JordyGomez/Thony-Ramaldi`. No imprimir credenciales de remotos.
3. Revisar `git status --short`, diferencias locales y staged, ramas y commits.
4. Ejecutar `git fetch origin --prune`, comparar `HEAD` con `origin/main` y revisar commits remotos nuevos, autores, diffs y documentos de transferencia.
5. No atribuir un cambio a un asistente a partir de un nombre de autor: registrar la atribución solo cuando esté confirmada.
6. Integrar funcionalidad válida sin sobrescribir cambios locales desconocidos. Si el remoto no puede consultarse, indicarlo; no afirmar sincronización.

Repetir la revisión remota después de una tarea significativa y antes del commit, de publicar una rama o de proponer integración. No integrar cambios sobre un directorio con modificaciones sin proteger. Los cambios privados no publicados de otros colaboradores no son visibles.

## Implementación

- Next.js App Router, TypeScript estricto, componentes con nombres descriptivos y separación entre datos, configuración y UI.
- Usar los componentes de servidor por defecto; `use client` solo para interacción.
- Contacto centralizado en `src/lib/site.ts`. Las páginas obtienen los inmuebles con `getProperties()` (`src/data/get-properties.ts`): solo las fichas publicadas en Supabase (panel propio en `/admin`); `sampleProperties` de `src/data/properties.ts` son datos de ejemplo para pruebas con Supabase desactivado y para importar Alberobello, y nunca se muestran en producción. Mantener alineados el tipo `Property`, `supabase/schema.sql`, `src/data/property-row.ts` y `src/app/admin/property-input.ts`. Nunca usar la clave `service_role` en el proyecto.
- Mantener la dirección visual minimalista oscura (carbón, Inter fina, fotografía protagonista; ver `docs/ASSETS.md`), adaptación móvil, semántica y foco visible. Ningún texto por debajo de 12 px.
- Respetar `prefers-reduced-motion`. El contenido debe permanecer disponible si falla una animación o JavaScript.
- Cada propiedad ficticia debe mostrar “Demostración”, también en su ficha y en el mensaje de WhatsApp. No inventar anuncios reales, biografía, logros, estadísticas, testimonios, mapas ni recorridos.
- No crear una marca ficticia para reemplazar los logotipos faltantes. Ver `public/brand/README.md` y `docs/ASSETS.md`.
- No añadir backend propio, base de datos, autenticación, pagos ni motor de IA sin una tarea que lo autorice. El panel de propiedades usa Supabase (base de datos, archivos e inicio de sesión), autorizado por Yordi Lewis el 2026-10-18; la seguridad depende de las políticas de `supabase/schema.sql`.
- Mantener compatibilidad con Vercel y `next/image`. No desplegar automáticamente en producción.
- No guardar tokens, contraseñas o claves en archivos, logs o commits. `.env.local` queda ignorado.

## Validación y cierre

Ejecutar `npm ci`, `npm run lint`, `npm run typecheck`, `npm run build` y `npm test` cuando correspondan al cambio. Las pruebas de navegador requieren Chromium; ver README. Registrar lo que realmente se ejecutó, sus resultados y limitaciones. No afirmar que Core Web Vitals, Safari, dispositivos físicos o enlaces externos se verificaron si no se midieron.

Actualizar README si cambia la arquitectura o ejecución, añadir una entrada real a CHANGELOG, renovar HANDOFF y mantener los estados de ROADMAP. Conservar las entradas de ambos asistentes. Indicar colaborador, asistente confirmado, archivos, pruebas y commit real si ya existe.

Crear commits descriptivos solo con cambios intencionales. Publicar ramas con autorización y acceso; preparar PR cuando corresponda, sin fusionarlo automáticamente. Nunca ejecutar `git reset --hard`, `git clean -fd`, `git push --force`, reescribir historial compartido, eliminar trabajo ajeno o descartar modificaciones desconocidas sin autorización explícita.

Cada tarea de nube ya está aislada. Usar el checkout existente; no crear worktrees salvo solicitud expresa.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Contexto para Claude

Este es el mismo producto y repositorio que desarrolla Codex. Puedes modificar cualquier archivo, incluidos componentes, estilos, datos, dependencias y código escrito por otro asistente. No hay una división permanente de responsabilidades.

Al iniciar cada tarea:

1. Leer `README.md`.
2. Leer `AGENTS.md` y respetar sus reglas.
3. Leer `docs/CHANGELOG.md`.
4. Leer `docs/HANDOFF.md` y `docs/ROADMAP.md`.
5. Revisar Git local, ejecutar `git fetch origin --prune`, comparar ramas y examinar los cambios remotos relevantes antes de editar.
6. Revisar el código actual y las pruebas; continuar las funcionalidades válidas publicadas por Codex o cualquier colaborador.
7. No asumir que el estado descrito en documentos antiguos coincide con el remoto actual.

La integración parte del main de tu PR #3 (d0f5f09), conservando carbón, Inter, hero, carrusel, menú y galería grandes. Añade Alberobello en preparación, renta de maqueta autorizada de US$1,000, datos unitarios null, PDF/renders y mejoras de filtros, foco, galería y CTA móvil. Lee el estado actual de HANDOFF, ALBEROBELLO y AUDIT-INTEGRATION. El usuario autorizó después guardar commits, subir la rama y crear un PR para generar la preview de Vercel. Producción se actualiza al fusionar a main; no fusionar automáticamente. La rama anterior feat/thony-phase-two no es la base actual. No hay backend ni motor 3D. Logo reutilizable, retrato, datos definitivos y Facebook siguen pendientes.

Continuación acotada del preloader en `a5ae5b8`: el usuario pidió filtrar el nuevo texto para mejorar lo existente. Se conserva la introducción tipográfica y se añade un marco con apertura CSS detrás del nombre, sin restaurar el diseño anterior. Solo cambian el componente y su bloque CSS. Hay espera del hero/fuentes, respiración de línea, límite de 5 s y salida por interacción; se mantiene una vez por sesión y no aparece al llegar por SPA desde una ficha. `site.logo` se reutilizará cuando exista el archivo autorizado; no se inventa. Revisión y 72 pruebas locales aprobadas en docs/PRELOADER.md. Se entrega en el mismo PR #4; comprobar los checks de su nuevo commit.

Al finalizar, comprobar otra vez el remoto, ejecutar validación apropiada y actualizar los documentos compartidos. No atribuir asistentes sin evidencia. Registrar cambios reales, nunca copiar los ejemplos del prompt como historial ocurrido. No desplegar producción ni fusionar PR automáticamente.

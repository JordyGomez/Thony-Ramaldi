> Documento histórico del borrador anterior. La integración actual parte directamente del main de Claude y se documenta en AUDIT-INTEGRATION.md y HANDOFF.md. El PR #2 antiguo sigue separado.

# Revisión previa a guardar y publicar

Fecha: 2026-10-18. Alcance solicitado: comprobar los cambios publicados de Claude y detectar colisiones con el borrador local, sin guardar commits, publicar ni desplegar.

## Resultado: no está listo para integrar o publicar

Se consultaron todas las ramas mediante fetch y los PR de GitHub. Claude publicó `79da3d3267f749557ff5bc81ab7a39f019c483a8` en `claude/modest-ramanujan-526yik`; el [PR #3](https://github.com/JordyGomez/Thony-Ramaldi/pull/3) está fusionado en `main` mediante `d0f5f093d018bff6f4ac284d5fab64a4a5d3a1bb`. La atribución está confirmada por el contenido del PR, el registro compartido y la sesión/coautoría declaradas en el commit.

La rama local continúa en `feat/thony-phase-two`, HEAD `e82367a`, con el borrador de Alberobello sin commit. Su ancestro común con el nuevo main es `106e9ce`. El PR #2 contiene la fase 2 anterior, no el borrador local.

## Comprobación de conflictos

- Claude cambió 24 archivos desde el ancestro común.
- Hay 17 archivos modificados en ambos trabajos al considerar la fase 2 y el borrador local.
- La simulación de combinación de tres versiones detectó conflictos de texto en **13 archivos**: nueve de aplicación y cuatro de documentación.
- La combinación de las dos ramas ya publicadas también falla con conflictos: `git merge-tree --write-tree --name-only HEAD origin/main` devuelve 1 y señala diez archivos. No se hizo checkout, merge real, reset, stash, commit ni push; el árbol de trabajo conserva el borrador.
- GitHub confirma que el PR #2 está en estado `CONFLICTING` / `DIRTY` frente al main actual. La API de referencia de main coincide con el SHA obtenido por Git.
- Los archivos y versiones de cada simulación quedaron temporalmente en `/tmp/thony-collaboration-review/`; este documento conserva las conclusiones duraderas.

| Área | Archivos en conflicto | Qué hay que conciliar |
| --- | --- | --- |
| Identidad y estilos | `src/app/globals.css`, `src/app/opengraph-image.tsx` | Claude introduce carbón, blanco e Inter. El borrador usa verde/dorado de Ramaldi, fondos claros y tipografía editorial. No se pueden conservar ambos sistemas globales por simple concatenación. |
| Portada | `src/app/page.tsx` | Mantener el trabajo de portada/carrusel de Claude y decidir cómo integrar el hero y el bloque real de Alberobello, sin eliminar secciones válidas de ninguna versión. |
| Ficha | `src/app/propiedades/[slug]/page.tsx` | Conciliar la galería y tabla del rediseño con renta provisional, valores desconocidos, tipologías del proyecto, folleto y CTA móvil del borrador. |
| Catálogo y tarjetas | `src/components/catalog.tsx`, `src/components/property-card.tsx` | Conservar selección Reales, conteos derivados, exclusión de cifras provisionales y salidas accesibles, adaptando la presentación al diseño acordado. |
| Galería | `src/components/gallery.tsx` | Combinar presentación a pantalla completa con teclado, gestos, carga/error/reintento y distinción entre renders del proyecto e imágenes de demostración. |
| Navegación e introducción | `src/components/header.tsx`, `src/components/preloader.tsx` | Claude usa menú a pantalla completa en todos los tamaños y entrada tipográfica; la fase 2 usa menú móvil y puerta arquitectónica. La elección visual debe ser explícita y conservar foco, salida segura y movimiento reducido. |
| Memoria compartida | `README.md`, `docs/ASSETS.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md` | Conservar entradas de ambos colaboradores y describir el estado final, sin recuperar las afirmaciones antiguas de que no había cambios de Claude. |

## Riesgos que no resuelve un merge automático

1. **Carrusel nuevo:** [`showcase.tsx:62`](https://github.com/JordyGomez/Thony-Ramaldi/blob/79da3d3267f749557ff5bc81ab7a39f019c483a8/src/components/showcase.tsx#L62) etiqueta todos los registros como «Demostración». Si recibe los datos locales de Alberobello sin adaptarlo, también etiquetaría mal el alquiler real en preparación. Es un archivo nuevo de Claude y no genera un conflicto textual por sí mismo.
2. **Datos desconocidos:** la [tabla de la ficha remota](https://github.com/JordyGomez/Thony-Ramaldi/blob/79da3d3267f749557ff5bc81ab7a39f019c483a8/src/app/propiedades/%5Bslug%5D/page.tsx#L39) convierte los números a texto directamente. Aplicada a la unidad local desconocida mostraría `null` y `null m²`; también conserva avisos y precio de demostración. Debe adoptar la lógica real/provisional del borrador.
3. **Fuentes y reglas:** Claude actualizó `package.json`, lockfile y layout para Inter, y AGENTS establece tema oscuro y texto mínimo de 12 px. Las fuentes, tokens y módulos de la fase 2 deben revisarse junto a esos cambios; escoger archivos completos al azar puede dejar estilos o dependencias incompatibles.
4. **Pruebas de cada versión:** el PR #3 tiene checks de calidad y Vercel aprobados. El borrador local pasó 57 pruebas, con una omitida. Ninguno de esos resultados valida una combinación que todavía no existe.

## Antes de dar luz verde

Consolidar sobre el main actualizado preservando los cambios publicados de Claude, acordar una sola dirección visual con los colores de marca aportados, portar el alquiler y las mejoras funcionales, resolver la memoria compartida y ejecutar instalación apropiada, lint, tipos, build, suite y revisión visual sobre la combinación final.

Hasta completar esos pasos, no guardar una integración como si estuviera resuelta ni publicar el PR #2 directamente. El precio de US$1,000 continúa siendo una cifra provisional de maqueta y el estado del alquiler sigue en preparación. Los cambios privados de Claude que no se hayan publicado no son visibles en esta revisión.

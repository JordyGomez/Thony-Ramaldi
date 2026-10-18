# feat: evolucionar la experiencia premium de Thony Ramaldi

## Descripción

La aplicación publicada permitía explorar seis propiedades de demostración, pero la portada separaba la fotografía del titular, los filtros tenían lectura pequeña y el contacto quedaba lejos del inicio de las fichas móviles. Esta entrega evoluciona esa base con un hero inmersivo, movimiento coordinado con la puerta CSS existente, filtros activos retirables, galerías con teclado y gestos y una consulta contextual persistente en móvil.

La introducción conserva su límite de 2,3 segundos y reproducción por sesión, con salida segura y movimiento reducido. El menú y las transiciones conservan foco y retiran de la interacción los elementos que salen; la navegación, las fichas y las fotografías siguen disponibles sin JavaScript. Se mantienen las seis rutas, sus advertencias de demostración, los contactos confirmados y los mensajes de WhatsApp contextualizados. No se añaden dependencias.

La [auditoría con capturas antes/después](https://github.com/JordyGomez/Thony-Ramaldi/blob/feat/thony-phase-two/docs/AUDIT-PHASE-2.md) documenta portada, catálogo y ficha, además de los límites de la inspección pública y las mediciones locales. README, CLAUDE, HANDOFF, CHANGELOG y ROADMAP mantienen el contexto compartido de colaboración.

## Validación local

- `npm run lint`, `npm run typecheck` y build de producción aprobados.
- `CI=true npm test`: **43 aprobadas, 1 omitida** porque el caso de menú móvil no aplica a escritorio; 0 fallidas.
- Regresión de filtros combinados, vacío, destacados, seis fichas, 404 y contacto; pruebas nuevas de retirada de filtros/foco, salidas inertes, teclado, gestos, fallo/reintento de imagen y entrada segura.
- Sin desbordamiento en 360, 390, 768, 844 y 1440 px; movimiento reducido, preferencia dinámica y navegación sin JavaScript comprobados.
- axe sin infracciones en los estados probados de portada, ficha y menú móvil; no equivale a certificar accesibilidad completa.

GitHub informa Vercel y calidad aprobados para el SHA base de main `106e9ce`; la evidencia disponible no permite confirmar qué SHA sirve exactamente el alias público. Esta rama no se fusiona ni se despliega manualmente a producción. Los checks y la preview de este PR requieren revisión antes de integrar.

Los logotipos originales, retrato, fotografías autorizadas de mayor resolución, inventario real y Facebook confirmado siguen pendientes. Las mediciones locales son muestras pequeñas sin throttling; no se afirma una mejora de rendimiento ni validación de Safari o dispositivos físicos. No hay backend, mapas, motor de IA ni recorridos 3D nuevos.

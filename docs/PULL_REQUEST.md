# feat: implementar la fase 1 de Thony Paulino · Ramaldi

## Descripción

El repositorio inicial solo contenía un README. Esta entrega incorpora una aplicación Next.js preparada para Vercel: portada editorial, entrada de puerta CSS 3D por sesión, navegación adaptable, catálogo local con cinco filtros, seis fichas de demostración y galerías accesibles. Las consultas por WhatsApp incluyen la referencia de la ficha y dejan claro que los datos son ficticios.

Los datos oficiales de contacto están centralizados. No se añaden backend, autenticación, mapas ni recorridos 3D. Los logotipos originales, retrato, Facebook y publicaciones reales permanecen pendientes de material confirmado. Se documenta la procedencia de las imágenes ilustrativas.

Se incorporan README, reglas comunes para Codex/Claude, CHANGELOG, HANDOFF, ROADMAP, pruebas y configuración de CI. No existe división de archivos por asistente.

## Validación local

- Instalación mediante `npm ci`, lint, TypeScript y build de producción aprobados.
- Playwright/Chromium: 17 pruebas aprobadas, 1 omitida porque el menú móvil no aplica al proyecto de escritorio; 0 fallidas.
- Filtros combinados, vacío, destacados, las seis fichas, 404, contacto, galería, teclado, foco, movimiento reducido y contenido sin JavaScript.
- Sin desbordamiento horizontal en los anchos probados de 360 a 1440 px.
- axe sin infracciones en los estados de portada, ficha y menú móvil probados.

Revisar contenido autorizado y derechos de fotografías antes de un lanzamiento comercial. Los resultados locales no constituyen un despliegue ni una ejecución remota de GitHub Actions. No fusionar automáticamente.

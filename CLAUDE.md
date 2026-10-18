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

Estado vigente: el usuario rechazó sustituir tu composición y pidió restaurarla, añadir 3D sobre ella, corregir las subidas y administrar el contenido de toda la web. Rama `feat/claude-design-full-admin`, desde main `3adaf47` (PR #6 fusionado). También autorizó expresamente llevar esta entrega a main al terminar. Ver HANDOFF y `docs/CLAUDE-ADMIN-REVIEW.md` para estado y pruebas reales.

Corrección posterior: PR #7 fusionado en main `6ef6e98`. El propietario pidió quitar la foto ilustrativa del pie que muestra su captura. Ese bloque se oculta hasta disponer de una propiedad pública no demo con fotos (no renders); se mantiene la firma/contactos y se usa su primera foto. No restaurar `villa.jpg` como reserva. Portada y resto del diseño se conservan. El editor permite una selección propia opcional, que solo se muestra cuando existe ese inventario.

Se recuperan portada fotográfica, Inter/carbón y pie de main 0742704, con profundidad y una búsqueda personal. La configuración publicada vive en site_content; los borradores y revisiones quedan privados y se guardan por RPC con control de conflictos. El panel añade Mi página web, Archivos y Configuración. La subida usa una ruta del mismo origen con sesión/rol, validación, progreso, diagnóstico y reintento. Las imágenes de biblioteca se conservan al borrar una ficha. La migración aditiva está en `supabase/migrations/20261018_site_editor.sql`; no asumir que está ejecutada en el proyecto real sin comprobarlo.

## Registro histórico — evolución cinematográfica del PR #6

La entrega previa partía de main 0742704 y fue fusionada en 3adaf47. Los siguientes párrafos describen esa versión anterior; no sustituyen la dirección vigente indicada arriba.

La puerta ahora tiene hoja sólida, espesor, marco y tirador CSS; revela la fotografía oficial, sin animar a la persona ni generar medios. El hero y pie usan arquitectura de marca en lugar de viviendas ilustrativas; los archivos anteriores y sus créditos se conservan. Inter, tono oscuro, titular y contactos siguen. Logo reutilizable y eventual video real siguen pendientes; site.logo y el plano interior están preparados.

Entrada inicial de home, una vez por sesión, 2,1 s normales y techo 5 s; mantiene salidas por interacción, movimiento reducido y no JS. La escena está memoizada. cinematic.css se importa solo en (site)/layout; profundidad por eventos solo en dispositivos elegibles y mientras se ve, menú escalonado y revelados diferenciados. No hay nuevo motor 3D ni dependencias.

Regla de datos: solo publicadas no demo en Supabase. Si falta configuración, catálogo vacío. Los ejemplos requieren THONY_TEST_FIXTURES=1 tanto al compilar como al ejecutar y no funcionan con VERCEL_ENV. Nunca habilitar fixtures en Vercel ni crear anuncios de ejemplo. CI comprueba ambos builds. Lectura anónima real 200 y cero publicaciones; /admin redirige a login. No se hicieron operaciones autenticadas ni escrituras en Supabase.

Validación local: lint, tipos y builds, 82 regresiones y 6 pruebas públicas aprobadas. Lighthouse simulado final 92/100, LCP 3,125 s, TBT 67 ms, CLS 0. Los límites y la iteración intermedia se conservan en el informe; no afirmar compatibilidad medida en Safari/dispositivos físicos ni operaciones CRUD reales. La entrega crea un nuevo PR y Preview; consultar sus checks del último commit antes de fusionar.

Al finalizar, comprobar otra vez el remoto, ejecutar validación apropiada y actualizar los documentos compartidos. No atribuir asistentes sin evidencia. Registrar cambios reales, nunca copiar los ejemplos del prompt como historial ocurrido. No desplegar producción ni fusionar PR automáticamente.

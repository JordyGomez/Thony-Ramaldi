# Evolucionar la entrada 3D y la presentación pública de Ramaldi

La introducción tenía un marco tenue y la portada empleaba una vivienda ilustrativa. Esta entrega parte del main del PR #5 de Claude y añade una puerta sólida CSS que revela el retrato oficial de Thony, con identidad tipográfica preparada para el logo auténtico. El hero y el pie pasan a una composición arquitectónica de marca; se conservan Inter, tono oscuro, titular y contactos.

La entrada dura 2,1 s normalmente, aparece una vez por sesión al abrir inicialmente la home y no se activa al llegar por SPA desde una ficha. Mantiene espera real del hero/fuentes, límite de 5 s, salida por interacción, movimiento reducido y no JS. Se añaden movimiento moderado por planos en equipos elegibles, menú escalonado, revelados diferenciados, tratamiento editorial del retrato, microinteracciones y estado vacío con contacto.

La web pública solo lee propiedades publicadas no demo. Sin Supabase, el catálogo queda vacío; las fixtures requieren un flag explícito de pruebas fuera de Vercel. CI compila y prueba ambos modos. No se crean anuncios ni se escriben datos en Supabase. Se preservan panel, Auth, proxy, acciones, uploads, mapeo y esquema/RLS de Claude; no cambian dependencias, configuración de Next, dominio ni proyecto Vercel.

Validación local: instalación con lockfile, lint, typecheck y builds aprobados; **82 regresiones y 6 pruebas públicas aprobadas**, sin fallos ni omisiones. Lectura anónima real de Supabase: 200, cero publicaciones; /admin redirige a login. No se realizaron operaciones autenticadas ni CRUD real. Se corrigió un nombre accesible de marca detectado por axe.

Lighthouse móvil simulado: performance 92/100 antes y después; LCP alrededor de 3,1 s, TBT de 98 a 67 ms y CLS 0 en la corrida final. El informe conserva también la regresión intermedia y las limitaciones. No equivale a pruebas de dispositivos físicos o Web Vitals de campo.

[Revisión y capturas](https://github.com/JordyGomez/Thony-Ramaldi/blob/feat/cinematic-ramaldi-experience/docs/CINEMATIC-REVIEW.md). [Lógica de la entrada](https://github.com/JordyGomez/Thony-Ramaldi/blob/feat/cinematic-ramaldi-experience/docs/PRELOADER.md).

Pendientes: fichero reutilizable del logo oficial, inventario/fotos verificadas y pruebas autenticadas/dispositivos reales. El video de entrada es opcional; se usa el retrato autorizado sin generar una persona. Se entrega mediante Preview del proyecto Vercel existente, sin fusión automática a main.

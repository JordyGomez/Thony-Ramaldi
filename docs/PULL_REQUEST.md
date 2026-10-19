El movimiento acumulado de la web resultaba exagerado. Se retiran las animaciones decorativas y se conserva la composición de Claude, con contenido inmediato y controles sin esperas.

La home deja de montar la puerta/preloader y el marco público deja de montar el controlador de paralaje. Los revelados son estáticos; el menú conserva pantalla completa, teclado y foco sin giros ni escalonado. Se desactivan zooms, desplazamientos al pasar el cursor, transiciones decorativas y scroll suave. El carrusel conserva sus controles manuales.

Defaults, validación y contexto fijan off/entry=false también para configuraciones e historial antiguos. El panel conserva la edición de contenido/paleta/secciones y muestra Marca y presentación, retirando sus controles de efectos. No se cambia el inventario ni se ejecuta SQL en Supabase.

Las pruebas de entrada se adaptan al comportamiento vigente: contenido accesible con imágenes lentas/fallidas, navegación y teclado sin overlay. Se comprueban superficies estáticas, ausencia de animaciones activas y normalización de configuraciones anteriores, conservando las regresiones de menú, filtros, galerías y publicación. Los checks del PR registran la validación completa.

Validación local: lint, tipos, builds de pruebas y con configuración pública real; 8 pruebas públicas, 13 del panel y 10 regresiones focalizadas aprobadas. CI ejecuta las 84 regresiones completas, la suite pública, el panel y el SQL existente. No se ejecuta la migración pendiente ni se escribe en el proyecto Supabase real.

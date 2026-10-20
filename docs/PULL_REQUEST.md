# Preparar dos identidades con administración multiusuario privada

La plataforma conserva la web personal de Thony y prepara la modalidad empresarial Ramaldi en la misma aplicación, Supabase y panel. Ambas configuraciones y sus historiales permanecen separados; SUPERADMIN por UID verificado controla el cambio reversible con autorización corporativa, impacto, confirmación, auditoría y revalidación. La web pública continúa en Thony.

Se amplía el editor existente con ámbitos personales/empresariales, incorporación por invitación y correo verificado, aprobación de miembros/perfiles/inmuebles, archivos privados y documentación. La vista previa empresarial exige SUPERADMIN y no publica datos ni activa registro. Guardar un borrador no concede visibilidad; ocultar un perfil retira su inventario y editarlo no permite reactivarlo.

La rama incluye como antecedente el PR #11 de Claude/Yordi Lewis (`3b1931f`): conserva su portada de fotografía y título. No modifica sus fuentes principales del hero, campos retirados, estilos públicos, configuración personal ni activos. Revisar la coordinación con #11 antes de integrar. No se fusiona ni se modifica producción en esta entrega.

Migraciones aditivas preparadas, sin DDL/usuarios/inventario de prueba en Supabase real. Instalación, bootstrap explícito de SUPERADMIN, hook de Auth, correo/CAPTCHA y aprobación corporativa siguen siendo pasos del propietario y de la empresa. El informe y las comprobaciones finales están en [PLATFORM-DELIVERY](PLATFORM-DELIVERY.md); procedimiento en [PLATFORM-OPERATIONS](PLATFORM-OPERATIONS.md).

## Descripción histórica del PR #10

El movimiento acumulado de la web resultaba exagerado. Se retiran las animaciones decorativas y se conserva la composición de Claude, con contenido inmediato y controles sin esperas.

La home deja de montar la puerta/preloader y el marco público deja de montar el controlador de paralaje. Los revelados son estáticos; el menú conserva pantalla completa, teclado y foco sin giros ni escalonado. Se desactivan zooms, desplazamientos al pasar el cursor, transiciones decorativas y scroll suave. El carrusel conserva sus controles manuales.

Defaults, validación y contexto fijan off/entry=false también para configuraciones e historial antiguos. El panel conserva la edición de contenido/paleta/secciones y muestra Marca y presentación, retirando sus controles de efectos. No se cambia el inventario ni se ejecuta SQL en Supabase.

Las pruebas de entrada se adaptan al comportamiento vigente: contenido accesible con imágenes lentas/fallidas, navegación y teclado sin overlay. Se comprueban superficies estáticas, ausencia de animaciones activas y normalización de configuraciones anteriores, conservando las regresiones de menú, filtros, galerías y publicación. Los checks del PR registran la validación completa.

Validación local: lint, tipos, builds de pruebas y con configuración pública real; 8 pruebas públicas, 13 del panel y 10 regresiones focalizadas aprobadas. CI ejecuta las 84 regresiones completas, la suite pública, el panel y el SQL existente. No se ejecuta la migración pendiente ni se escribe en el proyecto Supabase real.

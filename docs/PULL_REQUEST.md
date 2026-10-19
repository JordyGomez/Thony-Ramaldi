El menú de las tres rayas podía quedar recortado a una franja: en un viewport de 1600×800 se reprodujo un panel de 1600×192 con movimiento normal. Ahora ocupa la pantalla completa en todos los tamaños, conservando el diseño y las animaciones.

El panel es hermano de la cabecera, para que su transformación 3D y desenfoque no creen el área de referencia del hijo fixed. Su altura sigue el viewport, adapta ventanas bajas y permite desplazamiento vertical sin desbordamiento horizontal. El respaldo sin JavaScript utiliza una media query; se retira el style del noscript cliente que también afectaba la cabecera con JavaScript activo. Se conservan foco, teclado, Escape y enlaces.

Se eliminan el botón Importar Alberobello, la acción de servidor y el texto que lo recomendaba. El panel ofrece crear propiedades manualmente; no se modifican ni borran propiedades o archivos existentes.

Las comprobaciones públicas verifican scroll con movimiento normal, seis tamaños/orientaciones, redimensionado abierto, opciones visibles, foco y axe. Las regresiones comprueban navegación sin JavaScript y cierre animado; el panel de pruebas comprueba la ausencia del importador. No se usan credenciales ni se escribe en Supabase real.

Validación local: lint, tipos, builds público/fixtures/panel/configuración pública real; **8 pruebas públicas, 10 regresiones seleccionadas de navegación y 12 de panel aprobadas**, sin fallos. Los checks del PR ejecutan también el resto de regresiones y las comprobaciones de SQL existentes.

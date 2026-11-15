# Introducción 3D: puerta de caoba

Pantalla de carga de la portada. Sustituye como presentación a la puerta CSS anterior, que sigue sin montarse.

## Qué ve el visitante

1. El HTML del servidor trae un póster: un cuadro real de la escena con la puerta cerrada. No hay espera en blanco.
2. Al estar listo WebGL, el lienzo sustituye al póster con el mismo encuadre.
3. La hoja gira sobre sus bisagras, sale luz cálida del interior, la cámara avanza un poco y la escena se disuelve hacia la portada.

Duración nominal: 2,78 s desde que la escena está lista. Límite absoluto: 5 s desde el primer pintado, por temporizador y por CSS.

## Cuándo no se reproduce en 3D

| Situación | Comportamiento |
| --- | --- |
| Ya vista en la sesión (cookie `thony_intro`) | El servidor no la envía |
| Llegada por una ficha y vuelta a la portada | No aparece |
| `prefers-reduced-motion` | No aparece |
| Sin JavaScript | No aparece (`@media (scripting: none)`) |
| Sin WebGL, ahorro de datos, 2G o poca memoria | Póster y disolución, sin 3D |
| Escena no lista en 2,1 s o primer cuadro de más de 160 ms | Póster y disolución |
| Tecla, clic, toque, rueda o pestaña oculta | Se retira al instante |

Al terminar se liberan geometrías, materiales, texturas y sombras, y se pierde el contexto WebGL: no queda consumo de GPU.

## Archivos

- `src/lib/intro.ts`: tiempos, encuadre y rutas de recursos.
- `src/components/intro/door-scene.ts`: escena (solo se descarga si va a reproducirse).
- `src/components/intro/door-intro.tsx` y `.module.css`: ciclo de vida, salidas y póster.
- `src/app/(site)/page.tsx`: decide en el servidor si la envía.
- `scripts/render-intro-poster.mjs`: regenera pósteres (`--frames` guarda cuadros de revisión).

El póster y la cámara mantienen visible una caja de 1,9 × 3,3 m. Cambiar `introFrame` obliga a ajustar el CSS del póster y a regenerarlo.

## Panel

`/admin/web` → Marca y presentación: activar o volver a entrada directa, frecuencia (una vez por sesión o en cada apertura de la portada), verificar recursos y previsualizar. No hay ajuste de duración.

## Comprobado y no comprobado

Comprobado en Chromium con render por software, escritorio y móvil: 14 pruebas en `tests/intro.spec.ts`. No comprobado: Safari, teléfonos físicos, consumo de batería ni fluidez en GPU reales. No se evaluó postprocesado (bloom) para no añadir coste de GPU.

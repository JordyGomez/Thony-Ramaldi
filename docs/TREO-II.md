# Primera ficha — TREO II Residences

## Fuentes y datos comprobados

Tarea del 2026-10-23, Yordi Gómez con Codex. Base `3b71148`, después del PR #14 de Claude/Yordi Lewis (`137a0c0`), revisado mediante commits, diffs y documentación. Ese PR solo actualiza HANDOFF/CHANGELOG y documenta las migraciones ya instaladas en Supabase; se conserva completo. Lectura pública inicial: catálogo con cero propiedades y modo Thony. No se conceden roles ni se cambia la identidad pública.

El usuario confirmó **Santiago, apartamentos en venta y precios USD**. El sector es desconocido; no se inventa dirección, coordenadas, promotor, entrega, financiación ni estado de obra. La disponibilidad actual y condiciones quedan por confirmar con Thony. No se afirma que las 16 unidades estén disponibles en tiempo real.

La tabla de precios aportada contiene 16 referencias únicas: 10 con área 119 y 6 con área 122; todas con 3 habitaciones y 2 parqueos, con 2 o 2.5 baños. Las superficies se presentan en m² según la convención del catálogo; el asesor debe comprobarlas al revisar la ficha. Precio desde USD 214,497.50; máximo del listado USD 223,217.22. Se conservan centavos y baños fraccionarios.

ZIP y PDF adjuntos superaban 32 MiB por archivo. El usuario facilitó dos carpetas Drive de renders. Se recuperaron 13 imágenes originales, inspeccionadas y optimizadas en WebP; procedencia, dimensiones, tamaño y hash original en [README de medios](../public/images/treo-ii/README.md). **El PDF no pudo leerse**: una ruta local Windows no es accesible desde el entorno. No se publica el PDF ni un enlace roto a él, ni se atribuyen características a su contenido.

La imagen llamada «Int. 03» muestra un dormitorio y se describe como tal. Hay exteriores, piscina, terraza, comedor/cocina, gimnasio, lobby, dos isométricos y plano general. Se identifican como material renderizado del proyecto; no prueban que una unidad esté terminada. No se vincula el tipo A/B a una unidad concreta sin confirmación.

## Diseño y funcionamiento

La composición de Claude se conserva. Solo la ficha `treo-ii-residences`, publicada/no demo y con renders/listado estructurado, usa la nueva presentación: portada con profundidad, precio desde, selector de unidades/edificios, planos isométricos con perspectiva controlada, galería y contacto contextual.

No hay WebGL, modelo GLB inventado, recorrido virtual, preloader, paralaje global o movimiento automático. La profundidad afecta únicamente los marcos de la ficha y responde a controles explícitos; con movimiento reducido se eliminan esas transformaciones. Menú, portada, CMS y otras propiedades conservan su diseño. Si la ficha pasa a fotografías o pierde su listado estructurado, utiliza la presentación clásica.

Las unidades públicas proceden del `project_typologies` de la propiedad en Supabase. Cada línea es legible, por ejemplo:

```text
G2 · Edificio G-H · 119 m² · USD 214497.50 · 3 habitaciones · 2 baños · 2 parqueos
```

El panel existente permite editar las líneas. El parser exige identificadores únicos, importes con dos decimales y características válidas; el formulario detecta líneas incompletas o duplicadas en esta ficha antes de guardar. Los proyectos con tipologías de texto siguen utilizando la presentación clásica. El precio desde debe coincidir con el mínimo de las unidades antes de guardar. No hay otra tabla, inventario o configuración pública paralela. `formatPrice()` conserva ahora los centavos cuando existen; los precios enteros mantienen su formato anterior.

Seleccionar una unidad actualiza sus características, precio y el mensaje de contacto manual por WhatsApp. El enlace de visita identifica el proyecto publicado mediante el flujo de citas existente; no inventa un ID de apartamento ni confirma reservas.

## Creación real con el panel existente

**No se dispone en esta sesión de una sesión autenticada de administrador de Supabase; no se ha creado una propiedad real desde el entorno de desarrollo.** Se entrega el material y el flujo completo listo para que un administrador ya autorizado complete el guardado, sin compartir credenciales ni relajar RLS.

1. Entrar en `/admin/proyectos/treo-ii` con la cuenta existente. También hay un enlace desde Propiedades cuando no existe ese slug.
2. Revisar «Ver presentación privada»: datos y renders reales del material recibido, sin escribir registros ni subir archivos. La ruta exige sesión/rol en servidor y no activa una URL pública mediante parámetros.
3. «Preparar imágenes y ficha» sube los 13 WebP al bucket existente mediante `/api/admin/media`, conservando permisos, origen, validación de firma/tamaño y progreso real. No son imágenes de prueba. Si algo falla, reintenta las pendientes; no borra medios compartidos.
4. Revisar el formulario habitual, las unidades y los datos pendientes. «Publicada» controla visibilidad. Pulsar «Publicar propiedad» guarda con el servidor/RLS existentes; desmarcarla permite guardar un borrador.
5. La ficha pública aparecerá en `/propiedades/treo-ii-residences` y en el catálogo tras el guardado y su revalidación. Antes, esa ruta pública responde 404: no se sustituye la base de datos por una ficha estática.

Si el slug ya existe, la preparación muestra un enlace a editarlo y no sube otra vez los archivos ni reemplaza la ficha. Una carrera entre sesiones sigue protegida por la unicidad del slug en Supabase; el formulario informa del conflicto y conserva la edición, sin sobrescribir a otro administrador. Las imágenes ya subidas quedan en la biblioteca conforme a la política existente.

No requiere una migración nueva, otra base de datos, bucket o cuenta de Auth. No concede acceso a agentes empresariales. El modo Ramaldi y la agenda continúan con su configuración existente. La interfaz de preparación en Vercel Preview permite revisión y desactiva su botón de subida; las rutas y API existentes conservan sus controles de administración.

## Archivos y validación

- `src/data/treo-ii-source.json` y `treo-ii.ts`: transcripción y paquete de preparación solo de servidor (`server-only`); los datos de preparación llegan al cliente únicamente después del control de sesión/rol. Nunca se añaden a `getProperties()` como fallback público.
- `src/lib/project-units.ts`: formato legible, lectura/validación y precios exactos.
- `src/components/project/*`: presentación, selector, planos y estilos aislados.
- `src/app/admin/proyectos/treo-ii/*`: preparación y preview protegidas; reutiliza PropertyForm, Auth, Storage y acción existentes.
- `public/images/treo-ii/*`: 13 WebP y procedencia.
- Modificaciones puntuales en ficha pública, inicio del panel, validación/formulario y formato de precios. Se corrige la numeración de las miniaturas compartidas para que el texto visible coincida con su nombre accesible y la imagen 10 no aparezca como «010». No hay cambios de esquema, permisos o animaciones globales.
- `tests-admin/treo.spec.ts`: datos/centavos, privacidad, preview sin escrituras, preparación/subida/publicación, selector/contacto, no duplicación, PC/móvil y axe contra servicios locales aislados.

Validación local: lint y TypeScript aprobados; 182 comprobaciones sin fallos (84 regresiones web, 8 públicas, 17 de administración y 73 SQL). Las pruebas del panel incluyen los cuatro casos nuevos de TREO II y la publicación completa contra un servicio local aislado. CI también comprueba las suites empresarial y de citas antes de integrar.

Capturas reales de esa prueba: [escritorio](screenshots/treo-ii-desktop.png) y [móvil](screenshots/treo-ii-mobile.png). Documentan el diseño, no una publicación en Supabase de producción. Los tests nunca crean propiedades en Supabase real ni envían mensajes; Chromium no equivale a Safari o móviles físicos. La integración/estado de despliegue se registra en HANDOFF y en el PR.

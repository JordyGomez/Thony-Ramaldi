# Recursos visuales

Presentación vigente: estática, por petición posterior del propietario. La puerta y la introducción ya no se montan; el retrato oficial se conserva en Sobre Thony y las fotografías de portada/inventario mantienen sus usos y procedencia. El pie sigue esperando fotos de propiedades publicadas. Los registros de profundidad/3D siguientes son históricos y no autorizan reactivar esos efectos.

## Uso actual — pie sin fotografía ilustrativa

Petición posterior del propietario: retirar `villa.jpg` del pie por su calidad y esperar fotos de propiedades publicadas. Sin inventario público no demo con fotografías (no renders), se omite todo el bloque de imagen, manteniendo firma/contactos. Cuando existe, se utiliza la primera foto de ese inventario o la selección propia opcional del editor. El aviso automático identifica la propiedad, sin llamarla ilustrativa. El archivo histórico se conserva por las fixtures; no debe reaparecer en el pie desde una configuración antigua. La portada `portada.jpg` sigue con su aviso ilustrativo.

## Registro anterior — composición de Claude con profundidad y editor

Por instrucción posterior del propietario se restaura la portada `portada.jpg` elegida con Claude y el pie `villa.jpg`, conservando sus avisos de fotografía ilustrativa y créditos. No son anuncios ni inventario de Thony. La portada solicita una resolución apropiada al recorte vertical móvil mediante sizes; no se agranda ni reconstruye la fotografía con IA.

El retrato oficial sigue en la introducción y presentación. La geometría 3D acompaña las interacciones; no reemplaza las fotografías. El panel puede subir el logo original, cambiar portada/retrato/pie e imagen social y reutilizar archivos, sin que un agente invente una marca. Las imágenes nuevas deben ser originales autorizados por el propietario. Los archivos compartidos se conservan al borrar una propiedad.

Las capturas en `audit/claude-cms` muestran la revisión local. Las del panel usan el doble de Supabase de pruebas, sin entrar en la cuenta real ni publicar inventario. La procedencia histórica de recursos se conserva abajo.

## Registro histórico — evolución cinematográfica del PR #6

La entrada, el hero y Sobre Thony usan el retrato oficial entregado por el propietario. La puerta, sus materiales y las composiciones de marca del hero/pie son geometría CSS, no viviendas ni recorridos comercializados. No se generan fotografías, personas, videos ni propiedades. El retrato se revela como un plano fotográfico; no se simulan movimientos corporales ni se inventa un cuerpo.

El nuevo brief pide evitar viviendas ilustrativas en portada. `portada.jpg`, elegida previamente por Yordi Lewis, y los recursos históricos se conservan con su procedencia, pero ya no se renderizan como portada ni pie públicos. Las fotografías de las fichas públicas proceden únicamente de publicaciones no marcadas como demostración en Supabase; las imágenes de ejemplo quedan en las pruebas aisladas.

El usuario volvió a adjuntar las dos referencias del logo Ramaldi, clara y verde/dorada. Se ven en el chat, pero sus bytes no están disponibles como archivos reutilizables en el checkout; no se trazaron ni reconstruyeron. `site.logo` sigue preparado para el SVG/PNG autorizado, preferiblemente con transparencia y versión apta para fondo oscuro. La ausencia de un video real no se sustituye con una persona sintética: la escena utiliza el retrato autorizado.

## Identidad

Dirección visual vigente (desde el rediseño minimalista del 2026-10-18): carbón `#2B2B2B`, superficies `#333333` y `#222222`, blanco `#FFFFFF`, grises de texto `#B0B0B0`/`#9E9E9E` (contraste AA sobre carbón) y acento dorado `#C9A96A` solo para avisos de demostración. Paleta original indicada por el propietario, conservada como referencia para cuando lleguen los logotipos: petróleo `#477D79`, dorado `#D99A00`, dorado claro `#F0CA55`, marfil `#F8F6F0`, carbón `#192B2B`, blanco `#FFFFFF`. El petróleo profundo `#285651` mejora el contraste del texto pequeño y botones. Ajustar la paleta cuando lleguen los logotipos originales; no se han declarado colores certificados.

Se recibieron referencias visuales del logo Ramaldi para sus acentos; falta el archivo reutilizable. El retrato de Thony (`public/images/thony-paulino.jpg`, 853×1280, JPEG) lo entregó Yordi Lewis el 2026-10-18 como foto oficial de Thony. El encabezado utiliza su nombre y el de Ramaldi como texto. `public/brand/README.md` explica la incorporación de los originales. No se ha utilizado una web externa de Ramaldi.

## Fotografías de demostración

Copias locales del proyecto público [Homeverse de codewithsadee](https://github.com/codewithsadee/homeverse), fijadas al commit `24db592aecf03f0caef6b038674ec0e07f91a5dd`. Su README indica literalmente: “This project is **free to use** and does not contains any license.” Esa declaración no acredita por separado la autoría o la licencia de cada fotografía. Antes de un lanzamiento comercial, sustituir las imágenes por fotografías autorizadas del inventario o confirmar los derechos de cada original. No se afirma que sean fotografías de inmuebles gestionados por Thony.

| Archivo local | Archivo de origen en `assets/images/` | Contenido |
| --- | --- | --- |
| `hero.jpg` | `blog-2.jpg` | Residencia con piscina |
| `living.jpg` | `about-banner-2.jpg` | Sala luminosa |
| `villa.jpg` | `property-1.jpg` | Fachada residencial con jardín |
| `bedroom.jpg` | `property-2.jpg` | Dormitorio |
| `pool.jpg` | `blog-3.jpg` | Balcón con vegetación tropical |
| `kitchen.jpg` | `blog-1.png` | Sala con sofá oscuro |

Los nombres de archivo son identificadores internos; las descripciones alternativas explican el contenido real. Se ha normalizado el formato a JPEG mediante Sharp y se sirve con `next/image`, importaciones estáticas con hash del contenido, tamaños responsive y carga diferida. El hash cambia al sustituir el archivo y evita conservar fotografías antiguas en la caché de optimización. No se requieren peticiones del navegador a un proveedor externo de fotografías. Las fotos de una galería son referencias independientes, no un reportaje del mismo inmueble.

El intento de fase 1 devolvió HTTP 403. Maddock sí se inspeccionó visualmente después por Codex y Claude como referencia estética; no se copiaron sus imágenes, código o identidad. La integración actual conserva la dirección oscura de Claude.

## Tipografías e iconos

- Inter (variable), instalada con `@fontsource-variable/inter` y servida localmente; licencia OFL distribuida con el paquete. Sustituye a Manrope y Cormorant Garamond.
- Lucide React, licencia ISC.
- Icono de WhatsApp dibujado como SVG de interfaz; no sustituye a los logotipos corporativos.
- Open Graph: composición tipográfica propia, generada por Next.js sin fotografías externas.

## Material Alberobello

PDF original y cuatro renders del proyecto aportados por el propietario. Se identifican como renders, no fotografías actuales del apartamento. Páginas, hash y extracción se documentan en [ALBEROBELLO](ALBEROBELLO.md). Los contactos del promotor en el PDF no sustituyen a Thony. La renta de US$1,000 es solo un importe de maqueta autorizado. Acentos de marca y contraste en [BRAND](BRAND.md).

## Fotografía de portada

`public/images/portada.jpg` (2400×1350, JPEG optimizado): “A modern house with a walkway leading to the front door”, foto de **Salman Saqib** en Unsplash (https://unsplash.com/photos/a-modern-house-with-a-walkway-leading-to-the-front-door-mmuGuSv208c, autor https://unsplash.com/@salmansaqib). Licencia Unsplash: uso comercial gratuito sin atribución obligatoria; se registra el crédito igualmente. Es ilustrativa, no una propiedad de Thony: la portada mantiene el aviso “Fotografía ilustrativa”. Elegida por Yordi Lewis el 2026-10-18 entre cuatro candidatas para sustituir `hero.jpg` (800 px, insuficiente a pantalla completa). `hero.jpg` sigue solo en los datos de ejemplo.

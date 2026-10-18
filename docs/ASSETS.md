# Recursos visuales

## Identidad

Dirección visual vigente (desde el rediseño minimalista del 2026-10-18): carbón `#2B2B2B`, superficies `#333333` y `#222222`, blanco `#FFFFFF`, grises de texto `#B0B0B0`/`#9E9E9E` (contraste AA sobre carbón) y acento dorado `#C9A96A` solo para avisos de demostración. Paleta original indicada por el propietario, conservada como referencia para cuando lleguen los logotipos: petróleo `#477D79`, dorado `#D99A00`, dorado claro `#F0CA55`, marfil `#F8F6F0`, carbón `#192B2B`, blanco `#FFFFFF`. El petróleo profundo `#285651` mejora el contraste del texto pequeño y botones. Ajustar la paleta cuando lleguen los logotipos originales; no se han declarado colores certificados.

Se recibieron referencias visuales del logo Ramaldi para sus acentos; falta el archivo reutilizable y el retrato de Thony. El encabezado utiliza su nombre y el de Ramaldi como texto. `public/brand/README.md` explica la incorporación de los originales. No se ha utilizado una web externa de Ramaldi.

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

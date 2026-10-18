# Recursos visuales

## Identidad

Paleta aproximada indicada por el propietario: petróleo `#477D79`, dorado `#D99A00`, dorado claro `#F0CA55`, marfil `#F8F6F0`, carbón `#192B2B`, blanco `#FFFFFF`. El petróleo profundo `#285651` mejora el contraste del texto pequeño y botones. Ajustar la paleta cuando lleguen los logotipos originales; no se han declarado colores certificados.

Los logotipos y el retrato de Thony no están disponibles. El encabezado utiliza su nombre y el de Ramaldi como texto. `public/brand/README.md` explica la incorporación de los originales. No se ha utilizado una web externa de Ramaldi.

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

En la fase 1, el intento de acceder a Maddock devolvió HTTP 403. En la fase 2 sí se inspeccionó visualmente como referencia estética mediante el transporte documentado en [la auditoría](AUDIT-PHASE-2.md). No se copiaron sus imágenes, código ni identidad. Se conservan las fotografías locales ilustrativas y su caché por hash; solo se reordenaron dos imágenes principales entre las fichas de demostración.

## Tipografías e iconos

- Manrope y Cormorant Garamond, instaladas con Fontsource y servidas localmente; sus licencias se distribuyen con los paquetes.
- Lucide React, licencia ISC.
- Icono de WhatsApp dibujado como SVG de interfaz; no sustituye a los logotipos corporativos.
- Open Graph: composición tipográfica propia, generada por Next.js sin fotografías externas.

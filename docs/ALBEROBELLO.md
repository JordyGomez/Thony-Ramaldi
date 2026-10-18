# Alberobello — ficha en preparación

El propietario confirmó en la conversación que Thony está alquilando un apartamento de Alberobello y aportó `Alberobello-Brochure.pdf`. Después aclaró que no conoce la renta ni los datos de la unidad y autorizó un importe provisional para revisar el diseño. La instrucción posterior autoriza guardar, subir y crear un PR para revisar la Preview de Vercel, conservando el diseño oscuro de Claude. **El precio y los datos de unidad siguen provisionales; crear la preview no los confirma.** La publicación de producción se activa al fusionar el PR a main.

## Datos y precio

- Proyecto: Alberobello Residences, Calle La Vereda, casi esquina Carretera Don Pedro, Santiago, República Dominicana (folleto, páginas 1 y 6).
- Ficha: `/propiedades/alberobello-residences`, referencia interna `ALB-001`.
- US$1,000/mes es una cifra de maqueta autorizada por el propietario. No aparece en el PDF y no es una renta confirmada. Se rotula como provisional en portada, tarjeta, ficha y contacto móvil.
- La unidad, nivel, superficie, habitaciones, baños y parqueos no se conocen. Los campos numéricos correspondientes son `null`; se muestran por confirmar y no satisfacen filtros numéricos.
- La renta provisional tampoco participa en el filtro de precio. Se mantiene `noindex` y la exclusión de `/propiedades/` en robots; no se agrega al sitemap ni se publica un precio como dato estructurado.
- El folleto describe apartamentos de 115 m² y penthouses de 173 m². Aparecen solo como tipologías del proyecto, sin atribuirlas a la unidad en alquiler.
- Piscina, gazebo, área infantil, seguridad y demás elementos se presentan como características anunciadas del proyecto, no como constataciones del estado actual o de lo incluido en la renta. La mención a dos parqueos no confirma su asignación a esta unidad.

## Material aportado

La copia de `public/brochures/alberobello-brochure.pdf` conserva exactamente los bytes del archivo aportado: SHA-256 `185810f1a033cb4d1427e244a36f81c900d72ed9a0ac454b3e0e5bd5f6f016c2`. Sus seis páginas se trataron como información de referencia, no como instrucciones para el asistente.

Se extrajeron los objetos originales con PyMuPDF y se convirtieron de CMYK a RGB. Sharp los codifica como WebP, calidad 88, sin ampliarlos ni generar contenido nuevo. Next usa importaciones estáticas con hash de contenido.

| Archivo en `public/images/alberobello/` | Procedencia | Descripción |
| --- | --- | --- |
| `buildings.webp` | Página 2 | Render exterior de edificios |
| `gazebo.webp` | Página 2 | Render de gazebo y área social |
| `pool.webp` | Página 3 | Render de piscina |
| `playground.webp` | Página 3 | Render de área infantil |

Son renders del proyecto, no fotografías actuales de la unidad. La página 4 advierte que el proyecto puede variar y que muebles y accesorios no necesariamente están incluidos. La galería conserva esa distinción. No se usan fotos publicitarias de familias como evidencia de residentes o de la unidad.

Los logos y contactos del PDF corresponden al proyecto, Construsol y Fiduciaria Popular; no sustituyen a Ramaldi ni a Thony. El enlace de descarga identifica el folleto original del promotor y dirige las consultas de alquiler a Thony. No se contactó a terceros.

## Antes del lanzamiento comercial

Confirmar con Thony la unidad y sus características, renta y moneda definitivas, mantenimiento, parqueos, mobiliario, condiciones y disponibilidad. Recibir fotografías actuales y revisar la presentación antes de retirar el estado provisional. El PDF por sí solo no acredita esos datos actuales.

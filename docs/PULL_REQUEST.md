El pie mostraba una fotografía ilustrativa fija de baja resolución. Se retira el bloque de imagen completo hasta que un administrador publique una propiedad con fotografías; la firma, los contactos y la portada se conservan.

La primera foto del inventario público alimenta el pie, excluyendo demostraciones y renders, con su descripción y el nombre de la propiedad. Se reutiliza la lectura cacheada y la revalidación al publicar, ocultar o borrar. La selección propia del editor queda opcional y también requiere inventario; `villa.jpg` se ignora incluso en configuraciones anteriores. La previsualización utiliza la misma selección.

Validación local: lint, tipos, builds sin fixtures y con configuración pública real, **6 pruebas públicas y 12 del panel aprobadas**. La prueba de publicar/borrar comprueba ausencia inicial, aparición de la foto y retirada posterior, conservando los archivos compartidos. El panel usa servicios locales de prueba: no se crearon anuncios ni se hicieron escrituras en Supabase real. Los checks del PR incluyen las regresiones y SQL anteriores.

Esta corrección funciona sin la migración pendiente del editor. La publicación de contenido del CMS continúa requiriendo que quien administra el Supabase existente ejecute la migración aditiva ya preparada.

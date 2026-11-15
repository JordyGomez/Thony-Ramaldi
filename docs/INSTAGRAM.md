# Reel de Instagram

Bloque pequeño y vertical junto a la presentación de Thony. Sin scraping.

## Modos (`/admin/web` → Marca y presentación)

- **Automático**: último Reel propio por la API oficial de Instagram. Si no hay conexión, usa el enlace manual de reserva.
- **Solo el enlace indicado**: una URL de Reel validada y normalizada.
- **No mostrar**.

Sin conexión ni enlace, el bloque no aparece.

## Reproducción

- Automático: vídeo propio silenciado, en bucle, sin controles de sonido, que solo se reproduce mientras está en pantalla y se detiene con movimiento reducido. Si el vídeo falla, queda un enlace a Instagram.
- Manual: embed oficial de Instagram, cargado solo cuando el visitante pulsa «Ver reel». Instagram no permite reproducción automática silenciada en su embed; no se elude.

## Activar el modo automático (propietario)

1. La cuenta `@thonypaulino_ramaldi` debe ser profesional (empresa o creador).
2. Crear una app en Meta for Developers con el producto Instagram y generar un token de larga duración para esa cuenta.
3. Guardarlo en Vercel como `INSTAGRAM_ACCESS_TOKEN` (solo servidor) y redesplegar.
4. En el panel, «Comprobar conexión con Instagram».

El token caduca a los 60 días si no se renueva; al caducar, la web vuelve sola al enlace manual y el panel lo indica. La renovación automática no está implementada.

## Límites declarados

La llamada a `graph.instagram.com/me/media` sigue la documentación pública de Meta, pero **no se probó con un token real**. Se consulta como máximo cada 30 minutos. El Reel más reciente se distingue de la publicación más reciente por `media_product_type = REELS`.

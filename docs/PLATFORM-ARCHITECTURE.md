# Una plataforma, dos modalidades

## Revisión previa — 2026-10-20

Checkout limpio, main remoto `d427708`; fetch de todas las ramas y revisión de PR #2 y #11. PR #11 (`3b1931f`, Claude/Yordi Lewis, con atribución confirmada en sus commits y descripción) elimina los textos secundarios del hero y sus campos del editor. Esta rama parte de ese commit, que ya incorpora main: no reintroducir esos campos. No se integra ni publica producción. Los cambios de Claude `ebd2843`, `f9ef9fc`, `9e6ff2f`, `3fa894f` y `76b9c1f` se conservan: panel, proyecto Supabase, catálogo publicado, retrato y portada. La revisión remota no permite ver trabajo privado sin publicar.

Se inspeccionaron `schema.sql`, `20261018_site_editor.sql`, Auth/cookies/proxy, acciones de propiedades, API de archivos, CMS, vistas previas y lecturas públicas. Lecturas anónimas reales, sin escritura: properties 200; site_content, organizations y platform_state 404/PGRST205. No hay credencial DDL ni introspección privilegiada disponible; las funciones/triggers/RLS existentes se conocen por las migraciones versionadas, no por una inspección completa del servidor. La instalación deberá comparar el esquema real antes de ejecutarse.

## Decisiones

- Una aplicación, un Supabase, un Auth y un panel `/admin`. No se introduce otra base ni un sistema de contraseñas propio.
- `admin_users` y CMS personal se conservan. SUPERADMIN es un permiso separado por UID, asignado por el propietario de la base tras verificar la cuenta; ninguna promoción automática por correo ni metadatos del navegador.
- El editor existente `/admin/web` maneja ambos ámbitos con autorización en servidor; cambiar el ámbito editorial no cambia la identidad pública.
- Configuración personal en las tablas existentes; configuración empresarial, borradores e historial separados. Ningún contacto personal sirve como reserva corporativa.
- La preview de Thony consulta únicamente su visibilidad personal aunque Ramaldi esté activo; la empresarial exige perfiles públicos aprobados para identificar a cada responsable.
- Propiedades existentes: organización y asesor nulos, visibilidad personal conservada. Las nuevas empresariales tienen organización y responsable, aprobación y versión. Nunca duplicar inventario para cambiar de identidad.
- Escrituras empresariales por RPC transaccional con permisos del servidor y RLS. No permitir que el cliente cambie estado, propietario, organización o permisos mediante DML directo.
- Modo inicial Thony. La instalación no autoriza identidad corporativa, no crea empleados y no habilita registro abierto.
- Vista previa empresarial autenticada y reservada al superadministrador, sin indexación; no usar parámetros en rutas públicas para seleccionar identidad.
- Un snapshot público en una consulta mantiene modo, configuración, inventario y perfiles coherentes. Sin caché compartida del snapshot; revalidación de rutas tras publicaciones/cambios. No confiar en TTL para retirar un modo.
- Bucket empresarial privado separado del bucket público legado. Rutas de archivo ligadas a organización/UID, sin sobrescritura ni borrado por agentes. Lectura pública únicamente de referencias aprobadas en el modo activo.

## Riesgos e instalación

La migración del editor personal sigue pendiente en la base real; instalarla antes de la ampliación. El bucket `properties` ya es público: no mover ni privatizar los archivos actuales. Los archivos empresariales usan un bucket privado nuevo. Comprobar políticas adicionales no versionadas, copias de respaldo, propietario de funciones, URLs de Auth y verificación de email antes de habilitar incorporación.

La implementación y las pruebas se entregan por PR; no se ejecuta SQL ni se cambia main/producción en esta tarea. Ver los documentos de operación, permisos y pruebas al completar la entrega.

El renderizado público dinámico depende de una respuesta válida de Supabase; ya no promete servir el HTML ISR anterior durante una interrupción. No se sustituye una identidad no verificable por otra. La configuración de reversión usa una lectura mínima independiente del contenido editorial para seguir disponible ante una publicación dañada.

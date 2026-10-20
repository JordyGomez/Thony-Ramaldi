# Permisos y administración de empleados

La pertenencia vive en Supabase, nunca en un campo de perfil enviado por el navegador. Todos los flujos empresariales requieren sesión comprobada con `auth.getUser()` y permisos consultados por RPC; las RPC vuelven a comprobar UID, correo verificado, organización, estado y versión dentro de PostgreSQL. Las tablas nuevas no permiten DML directo a los clientes.

| Cuenta | Acceso autorizado |
| --- | --- |
| Visitante | Snapshot de la identidad activa y su inventario aprobado. Sin borradores, documentos privados, miembros ni auditorías. |
| Cuenta sin pertenencia | Inicio/cierre de sesión y recuperación. Crear una cuenta no concede empleo. |
| Solicitud pendiente | Su estado, observaciones, completar su solicitud y cerrar sesión. No inventario privado ni publicación. |
| Asesor activo | En modo empresarial habilitado: su perfil, sus borradores, sus archivos y documentos, solicitar revisión y retirar sin borrar. No cambiar propietario, organización, aprobación ni rol. |
| Administrador empresarial | Revisar incorporación de asesores, perfiles, propiedades y configuración empresarial. Puede preparar contenido privado antes de activar el modo. No cambiar la identidad pública, asignar administradores ni concederse permisos. |
| SUPERADMIN | Configuración avanzada, autorización corporativa, cambio/reversión de modo, vista previa privada y auditoría; revisión empresarial y asignación explícita de administradores. Solo lo concede el propietario de la base a un UID verificado. |
| Administrador personal legado | Conserva `/admin`, CMS personal y archivos actuales. `admin_users` no implica SUPERADMIN ni pertenencia empresarial. Puede acumular permisos únicamente si se conceden por separado. |

No se introduce una división de responsabilidades entre Codex y Claude. Tampoco se divide el producto en dos paneles independientes: `/admin/empresa` y `/admin/plataforma` amplían el panel existente y reutilizan su autenticación, barra, formulario y subidas.

## Incorporación

1. Un administrador empresarial o SUPERADMIN crea una invitación ligada a un correo. El enlace secreto se muestra una vez; la base conserva SHA-256, vigencia y uso, no el token original. No se envía automáticamente por un canal externo.
2. Solo con Ramaldi autorizado/activo y el registro habilitado, el invitado usa el enlace y CAPTCHA para registrarse con Supabase Auth. El hook `before_platform_user_created` también rechaza las altas directas fuera de Next.js si no hay invitación válida.
3. La persona verifica su correo, inicia sesión y vuelve a abrir la invitación para completar su solicitud. La aceptación compara el correo real de Auth, bloquea la invitación y la consume atómicamente.
4. La solicitud queda pendiente. Otra cuenta autorizada verifica el vínculo laboral y la aprueba como asesor. Solo SUPERADMIN puede otorgar `business_admin`.
5. Los administradores pueden suspender cuentas o revocar invitaciones sin borrar cuentas, fotos ni inventario. Suspender retira el perfil y las propiedades empresariales de la lectura pública.

No hay autorización por dominio de correo. `@ramaldigroup.com` sin invitación no permite registrarse mediante el hook ni administrar nada. Los metadatos de Auth contienen únicamente la referencia de invitación para verificarla; nunca determinan un rol.

## Perfiles y publicaciones

Un perfil se guarda en borrador y se solicita su aprobación por separado. La versión pública y su slug aprobado se conservan mientras se editan cambios; los textos nuevos no se publican automáticamente. El revisor verifica cargo, foto, contactos, redes y descripción. Ocultar/rechazar un perfil o suspender su cuenta lo retira del directorio y del inventario público asociado. Una autorización pública independiente del estado del borrador impide que el asesor lo reactive editando. Solo otra revisión autorizada lo habilita de nuevo.

Las propiedades nacen como borradores con organización y asesor asignados por el servidor. El formulario permite guardar datos incompletos; solicitar revisión exige referencia, ubicación, descripción, fotos descritas y precio confirmado. Flujo: borrador → pendiente → aprobado → publicado. También admite correcciones, rechazo, oculto, vendido y alquilado. Publicar requiere perfil aprobado y asesor activo. Editar ficha o documentos la devuelve a borrador y exige nueva revisión. El historial conserva observaciones y versiones.

Los agentes no se apropian de fichas ni editan las de otros. Los administradores revisan y solicitan correcciones; no se atribuyen la autoría comercial del agente. Solo SUPERADMIN puede autorizar la visibilidad adicional en Thony, sin duplicar la ficha. Retirar preserva el registro y sus archivos.

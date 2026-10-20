# Pruebas de plataforma

## Entornos y comandos

Node 24, dependencias del lockfile existente y Chromium. No se introduce una dependencia de producción ni se sustituye Supabase. PGlite se utiliza solo en desarrollo para ejecutar PostgreSQL, funciones, constraints, triggers y RLS de los SQL reales.

```sh
npm run lint
npm run typecheck
npm run test:database
THONY_TEST_FIXTURES=1 NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= npm run build
CI=true npm test
THONY_TEST_FIXTURES= NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= npm run build
CI=true npx playwright test --config=playwright.public.config.ts
CI=true npm run test:admin
CI=true npm run test:platform
```

Las suites de build no se ejecutan en paralelo: comparten `.next`. `test:admin` reconstruye contra el doble HTTP existente en 3335; `test:platform` reconstruye contra Auth/Storage locales y PostgreSQL real embebido en 3336. El servidor Next de plataforma usa 3400. Los scripts rechazan Vercel y nunca llaman a Supabase de producción. Después, recompilar para el modo que se necesite.

## Cobertura

- Editor personal existente, borradores, historial, publicaciones, archivos y conflictos conservados.
- Instalación repetible, datos actuales sin atribución empresarial, CRUD personal y RLS nuevas.
- Thony como inicio, ausencia del selector en cuentas comunes, negación de endpoint manual y de otros orígenes.
- SUPERADMIN, administrador empresarial, asesor, cuenta pendiente y cuenta sin pertenencia separados. No autopromoción por datos de perfil ni correo corporativo.
- Invitación, revocación, consumo, correo verificado y aprobación de membresía. Hook de Auth rechaza registros directos sin invitación. CAPTCHA/SMTP son modelos de proveedor locales, no validación de entrega real.
- Perfil público aprobado separado de borradores y slug pendiente; un perfil ocultado no reaparece al editar y su inventario deja de ser público. Las fotos no aceptan PDF por una RPC directa.
- Propiedades propias, borradores privados, solicitud, aprobación y publicación en pasos distintos. Control de versión, retirada al editar y prohibición de editar/publicar registros ajenos.
- Archivos privados por organización/UID, denegación de lectura ajena, sobrescritura y borrado. Políticas restrictivas frente a una concesión permisiva antigua adicional.
- Planos tras aprobación, documentos privados fuera del snapshot y conservados al retirar.
- Editor existente con ámbitos independientes y denegación del ámbito empresarial para un administrador personal. Preview personal con su propio catálogo aunque Ramaldi esté activo.
- Vista previa protegida PC/móvil, estados vacíos sin empleados falsos, ausencia de overflow y axe en los estados probados.
- Cambio explícito/reversible desde el panel, conservación de datos, auditoría, caché y pestaña pública abierta coherente. Sitemap/SEO según modo, rutas privadas fuera del índice.
- Recuperación, destino local permitido, actualización y cierre de sesión; enlace inválido sin acceso.

## Evidencia y límites

Validación local aprobada: lint, tipos y builds; 13 casos del panel anterior, 17 empresariales y 38 comprobaciones SQL. Las 84 regresiones pasaron en el primer ciclo. El pipeline del último SHA ejecuta el conjunto completo de 160 comprobaciones (84 regresiones, 8 públicas, 13 de panel, 17 empresariales y 38 SQL); el resultado exacto se consulta en los checks del PR #12, junto a HANDOFF/CHANGELOG. No trasladar resultados de un commit anterior al último sin ejecutar su validación correspondiente.

Se corrigió el renderizado dinámico de Next colocando `connection()` fuera del SDK y retirando la enumeración de parámetros de compilación para un catálogo que depende de la identidad por petición. Un error de locator de la selección se corrigió usando su rol accesible; la recuperación detectó un redirect al host interno y se corrigió preservando Host y cookies. No se retiraron aserciones de seguridad para conseguir una suite verde.

No se probaron cuentas reales, entrega de correo, CAPTCHA real, SQL gestionado, dispositivos físicos ni Safari. Las pruebas de Auth/Storage usan un doble HTTP local; las funciones y RLS sí se ejecutan contra PostgreSQL aislado. La web publicada solo se consulta de forma anónima, sin escrituras.

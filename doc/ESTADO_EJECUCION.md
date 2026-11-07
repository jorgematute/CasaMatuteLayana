# Estado de ejecución · Casa Matute

| Prompt | Estado | Build | Tests | Fecha de cierre |
|---|---|---|---|---|
| P00 Auditoría | completado | correcto | correcto (2/2) | 2026-10-31 |
| P01 Base de datos | completado | correcto | correcto (2/2) | 2026-10-31 |
| P02 Reglas de negocio | completado | correcto | correcto (38/38) | 2026-10-31 |
| P03 Servidor | completado | correcto | correcto (47/47) | 2026-10-31 |
| P04 Datos | completado | correcto | correcto (48/48) | 2026-11-07 |
| P05 API | completado | correcto | correcto (48/48) | 2026-11-07 |
| P06 Interfaz base y catálogos | completado | correcto | correcto (48/48) | 2026-11-07 |
| P07 Pagos y panel de alertas | completado | correcto | correcto (48/48) | 2026-11-07 |
| P08 Movimientos y aceptación | pendiente | | | |
| P09 Opcionales: saldo y categorías | pendiente | | | |
| P10 Opcionales: resumen y hormiga | pendiente | | | |

## Bitácora

### P00 Auditoría

- Archivos creados: `doc/ESTADO_ACTUAL.md`, `.github/copilot-instructions.md`, `doc/ESTADO_EJECUCION.md`, `doc/checkpoints/FASE_0_COMPLETADA.md`.
- Archivos modificados: ninguno.
- Comandos ejecutados: `npm.cmd run build` (correcto, código 0; Next.js 16.3.5); `npm.cmd test` (correcto, 1 archivo y 2 pruebas); inventario de variables de entorno limitado a nombres; comprobación de puerto sin imprimir URLs.
- Instalación: omitida porque `node_modules/` ya existía.
- Problemas y resolución: PowerShell no ejecutó `npm` directamente; se usó `npm.cmd` con ruta absoluta para obtener el resultado completo. Vitest mostró una advertencia informativa de configuración futura de Vite; no afectó las pruebas.
- Pendientes: confirmar que la credencial funcional expuesta en el plan fue cambiada antes de P01; verificar en Vercel que `CASAMATUTELAYANA_POSTGRES_URL` esté configurada. La variable existe localmente y usa puerto 6543.

### P01 Base de datos

- Requisito previo: el usuario confirmó que cambió la contraseña expuesta y verificó `.env.local` en `.gitignore` y que no hay credenciales en el repositorio ni en la entrega.
- Archivos creados: `supabase/migrations/20261003000200_casamatute_tablas.sql`, `supabase/migrations/20261003000300_casamatute_vista_seguridad.sql`, `scripts/conexion-bd.mjs`, `scripts/migrar.mjs`, `scripts/verificar-bd.mjs`, `doc/checkpoints/FASE_1_COMPLETADA.md`.
- Archivos modificados: `package.json`, `package-lock.json`, `doc/ESTADO_EJECUCION.md`.
- Migraciones aplicadas: M1 y M2 con el SQL de las secciones 8.2 y 8.3 del plan. Las migraciones anteriores de autenticación fueron verificadas en la base y registradas en `_migrations` sin reejecutarlas: existen `public.users`, `public.app_records`, la columna `is_admin`, el índice `users_admin_lookup_idx` y la función `handle_auth_user_sync()`.
- Conexión (estado inicial de P01): `CASAMATUTELAYANA_POSTGRES_URL` (puerto 6543) expiró al conectar desde este entorno. El helper informa el fallo y usa `CASAMATUTELAYANA_POSTGRES_URL_NON_POOLING` (conexión directa, puerto 5432), que sí respondió. En P01 ambos caminos conectaban con SSL `rejectUnauthorized: false`; en P03 se cambió a `true` para verificar certificados.
- Dependencias instaladas: `pg` y `@types/pg`.
- Verificación: las seis relaciones existen; RLS está activo en las cinco tablas; los ocho casos terminaron `OK`, con `ROLLBACK` y cero filas previas de prueba. El caso c documenta la incompatibilidad del plan: `'transferencia'` excede `VARCHAR(8)` y da `22001`; `'transfer'`, que cabe en la columna, alcanza `movimientos_tipo_valido` y da `23514`. No se alteró el SQL rector.
- Comandos: `npm.cmd run db:migrar` (correcto; repetición idempotente omitió todas las migraciones), `npm.cmd run db:verificar` (correcto; cero fallas), `npm.cmd run build` (correcto), `npm.cmd test` (correcto, 1 archivo y 2 pruebas).
- Salida completa de `db:verificar`: copiada en `doc/checkpoints/FASE_1_COMPLETADA.md`.
- Problemas y resolución: el pooler temporal no aceptó la conexión desde el entorno; se empleó explícitamente la variable de conexión directa y se dejó registrado. Se detectó y documentó la diferencia entre el SQLSTATE pedido para el literal `'transferencia'` y el comportamiento real debido a `VARCHAR(8)`.
- Pendientes: revisar la diferencia del caso c antes de cambiar el plan; confirmar en Vercel la disponibilidad de `CASAMATUTELAYANA_POSTGRES_URL`.

### P02 Reglas de negocio

- Archivos creados: `src/lib/config/presupuesto.ts`, `src/lib/reglas/errores.ts`, `src/lib/reglas/fechas.ts`, `src/lib/reglas/movimiento.ts`, `src/lib/reglas/urgencia.ts`, `src/lib/reglas/vinculacion.ts`, `src/lib/reglas/categoria.ts`, `src/lib/reglas/hormiga.ts`, `tests/reglas/ayudas.ts` y seis archivos de pruebas en `tests/reglas/`.
- Archivos modificados: `package.json` (script `test:ver`), `vitest.config.ts` (entorno Node, suite acotada a `tests/**/*.test.ts` y alias `@` existente) y este registro de ejecución.
- Dependencias: Vitest ya estaba instalado como dependencia de desarrollo; no fue necesario volver a instalarlo ni cambiar `package-lock.json`.
- Reglas: implementadas las reglas puras de movimiento, fechas, urgencia, vinculación y los módulos opcionales de categoría y gastos hormiga. Los errores y estados HTTP usan la tabla de la sección 11.2 del plan.
- Pruebas: cubiertos T-01 a T-33, además de casos complementarios para validar fechas, el reloj de Bogotá y reglas de borde. `npm.cmd test`: 6 archivos y 38 pruebas aprobados.
- Build: `npm.cmd run build` terminó correctamente. Durante la primera ejecución se corrigió un error de estrechamiento de tipos en el cálculo del último día del mes; la ejecución final fue exitosa.
- Restricciones: no se modificaron `app/`, login ni base de datos. No hay importaciones de `pg`, `next` o `process.env` dentro de `src/lib/reglas/`; `new Date()` solo aparece en el valor por defecto de `hoyBogota`.
- Pendientes: ninguno para P02.

### P03 Servidor

- Archivos creados: `src/lib/db/conexion.ts`, `src/lib/auth/sesion.ts`, `src/lib/http/respuestas.ts`, `src/lib/validacion/esquemas.ts`, `src/lib/formato.ts`, `src/app/api/hogar/sesion/route.ts` y `tests/infraestructura.test.ts`.
- Archivos modificados: `src/proxy.ts`, `src/app/login/page.tsx` y este registro de ejecución.
- Conexión: pool de `pg` con los parsers DATE, TIMESTAMP y BIGINT; reutiliza el pool global en desarrollo, toma `CASAMATUTELAYANA_POSTGRES_URL` y verifica el certificado TLS.
- Sesión: adaptador sobre `createSupabaseServerClient().auth.getUser()`; expone el correo o, si no está disponible, el identificador de usuario. `exigirSesion()` lanza `NO_AUTORIZADO` cuando no existe sesión.
- API y validación: respuestas con `Cache-Control: no-store`, traducción de errores de negocio/Zod/Postgres, lectura validada de cuerpos y esquemas Zod de las secciones 11.4 y RN-03.
- Protección y login: proxy protege `/hogar/:path*` y `/api/hogar/:path*`; las páginas redirigen a `/login` y la API devuelve 401 JSON sin sesión. El único cambio del login es el destino posterior al acceso, ahora `/hogar`.
- Verificación: `npm.cmd run build` correcto; `npm.cmd test` correcto (7 archivos, 47 pruebas). GET `/api/hogar/sesion` sin sesión devolvió 401 y `Cache-Control: no-store`. El usuario confirmó en el navegador que el login redirige a `/hogar` y que GET `/api/hogar/sesion` con sesión devuelve 200. `/hogar` puede mostrar 404 hasta P06.
- Servidor de desarrollo: el puerto 3000 ya tenía un servidor Next.js del repositorio activo; `npm.cmd run dev` detectó ese proceso y no se detuvo. Se verificó el endpoint sobre ese servidor.
- Pendientes: ninguno para P03.

### Revisión de seguridad previa al push

- Hallazgo corregido: la conexión PostgreSQL desactivaba la verificación del certificado TLS. Ahora el pool de aplicación y el helper de scripts usan `rejectUnauthorized: true`; la sección 10.7 del plan también refleja la configuración segura.
- Validación tras el cambio: `npm.cmd run build` correcto; `npm.cmd test` correcto (7 archivos, 47 pruebas).
- Auditoría de dependencias del 2026-10-31: se actualizaron en `package-lock.json` las seis familias que reportaban severidad alta (`brace-expansion`, `sharp`, `source-map-js`, `undici`, `vite` y `zod`), además de Next.js por los avisos críticos. `npm audit` ahora reporta 0 altas y 0 críticas; permanecen 16 moderadas.
- No se ejecutó `npm audit fix --force`: npm advierte que degradaría ESLint a una versión mayor incompatible para intentar resolver las moderadas restantes.
- Versiones fijadas en el lockfile: Next.js 16.4.3, Zod 4.6.7, sharp 0.35.5, source-map-js 1.2.2, undici 8.12.3, Vite 8.3.5 y brace-expansion 1.1.21 / 5.0.12.
- Validación tras actualizar dependencias: `npm.cmd run build` correcto con Next.js 16.4.3; `npm.cmd test` correcto (7 archivos, 47 pruebas).
- Push pendiente: el árbol de trabajo contiene cambios y archivos sin commit; las instrucciones del proyecto indican que el estudiante revisa y hace el commit. El HEAD local `main` coincide con `origin/main`.

### P04 Datos

- Archivos creados: `src/lib/datos/tipos.ts`, `eventos.ts`, `errores.ts`, `catalogos.ts`, `pagos.ts`, `saldo.ts`, `movimientos.ts`, `resumen.ts`, `panel.ts`, `conexion.ts` y `src/lib/dataService.ts`.
- Archivos modificados: `src/lib/reglas/vinculacion.ts`, `tests/reglas/vinculacion.test.ts`, `package.json`, `package-lock.json` y este registro.
- Scripts creados: `scripts/limpiar-prueba.mjs`, `scripts/probar-flujo.ts` y `scripts/cargar-demo.ts`; se agregaron `db:limpiar`, `probar:flujo` y `db:demo`.
- Dependencias: `tsx` instalado como dependencia de desarrollo.
- Acceso a datos: catálogos, saldo mensual, pagos, alertas, movimientos y panel usan SQL parametrizado. El registro de movimientos ejecuta las verificaciones, bloqueo del pago, comprobación del saldo, inserción, actualización del estado y evento dentro de una transacción. Los abonos que reducen un compromiso del mes no se descuentan dos veces al validar el saldo.
- Regla relacionada corregida: los abonos parciales abonables que exceden el restante ahora fallan con `MONTO_EXCEDE_RESTANTE`.
- Verificación local: `npm.cmd run build` correcto; `npm.cmd test` correcto (7 archivos, 48 pruebas); `npm.cmd run type-check` correcto; `git diff --check` sin errores. La única importación de `lib/db/conexion.ts` está dentro de `src/lib/datos/`.
- Salida de `npm.cmd run probar:flujo`: el script terminó con `Resultado de probar:flujo: 2 fallas.` antes del paso 1. La limpieza previa y la limpieza final no conectaron: el pooler agotó el tiempo y la alternativa falló con `SELF_SIGNED_CERT_IN_CHAIN`. No se ejecutó ninguna operación de la prueba.
- Salida de `npm.cmd run db:demo`: falló en la limpieza previa con el mismo error TLS, antes de crear datos demo.
- Diagnóstico de conexión: las URLs configuradas no permiten una conexión verificable desde este entorno; el pooler principal agota el tiempo, el certificado alterno no está en la cadena de confianza y un intento de conexión sin validar el certificado recibió `XX000` (tenant/usuario no reconocido). No se desactivó la validación TLS ni se imprimieron credenciales.
- Reintento tras informar el usuario que Supabase estaba pausado: `npm.cmd run probar:flujo` volvió a fallar en la limpieza previa y final; `npm.cmd run db:demo` volvió a fallar en la limpieza previa. En ambos continúa el timeout del pooler y la conexión alternativa devuelve `SELF_SIGNED_CERT_IN_CHAIN`; no se ejecutaron escrituras del flujo ni de demo. El proyecto pausado pudo ser un factor, pero no es el único bloqueo observable con la configuración actual.
- Reintento cuando el usuario confirmó estado `Healthy` (2026-11-07): `npm.cmd run probar:flujo` y `npm.cmd run db:demo` aún fallan antes de cualquier escritura; el pooler agota el tiempo y el fallback presenta `SELF_SIGNED_CERT_IN_CHAIN`. Ahora DNS y TCP responden en ambas URLs, pero `NODE_EXTRA_CA_CERTS` no está configurado en el proceso. Se mantiene la comprobación TLS estricta.
- Corrección tras el usuario configurar la CA: `scripts/limpiar-prueba.mjs` consiguió conectarse con la URL alternativa, pero el pool de aplicación seguía usando únicamente la URL principal y falló con `ECONNRESET`. `src/lib/db/conexion.ts` ahora prefiere `CASAMATUTELAYANA_POSTGRES_URL_NON_POOLING` y usa la principal como alternativa; ambas conservan la verificación TLS y se elimina `sslmode` para que no reemplace la configuración explícita del certificado.
- Limpieza: se quitó el `Promise.all` de consultas concurrentes sobre un único cliente `pg`; las lecturas ahora se ejecutan en secuencia, eliminando la advertencia de consultas simultáneas de `pg`.
- Salida final de `npm.cmd run probar:flujo` (con `NODE_EXTRA_CA_CERTS` apuntando a `certificados-locales/supabase-ca.crt`): pasos 1 a 14 en `OK`, `Resultado de probar:flujo: 0 fallas`. La limpieza final eliminó 6 movimientos, 6 eventos, 2 pagos, 1 categoría y 1 miembro.
- Salida final de `npm.cmd run db:demo`: correcto. Se crearon 2 miembros, 3 categorías, 1 ingreso, 3 gastos y 3 pagos. La regla `FECHA_NO_FUTURA` impidió crear el pago vencido; se anotó y se agregó un tercer pago con vencimiento a 1 día. La tabla mostró dos pagos rojos y uno amarillo.
- Validación final posterior a la corrección: `npm.cmd run build` correcto; `npm.cmd test` correcto (7 archivos, 48 pruebas); `npm.cmd run type-check` correcto; Prettier y `git diff --check` correctos.
- Estado: P04 implementado y validado contra la base real; P05 sigue pendiente, por lo que la fase 4 permanece abierta.

### P05 API

- Archivos creados: rutas para panel, movimientos, pagos, miembros y categorías; rutas dinámicas para eliminar pagos y actualizar miembros y categorías; `doc/checkpoints/FASE_4_COMPLETADA.md`.
- Archivos modificados: `src/lib/validacion/esquemas.ts` y este registro.
- Contratos: todas las rutas requieren sesión como primera instrucción y son dinámicas; filtros y cuerpos se validan con Zod; parámetros `[id]` se esperan como `Promise` y se validan como UUID. Las altas de pagos y movimientos responden 201; el movimiento registra el identificador de sesión. Se excluyeron los endpoints opcionales `/api/hogar/saldo` y `/api/hogar/resumen`.
- Sin sesión: GET `/api/hogar/panel`, GET `/api/hogar/pagos` y POST `/api/hogar/movimientos` devolvieron 401 `NO_AUTORIZADO` y `Cache-Control: no-store`.
- Filtros: estados de pago, valores de `incluirInactivos` y fechas inválidos devolvieron 400 `DATOS_INVALIDOS`.
- Con sesión: GET `/api/hogar/panel` devolvió las tres alertas DEMO (dos rojas y una amarilla) y saldo: ingresos $3.000.000, gastos $647.000, pagos pendientes del mes $575.000, disponible $1.778.000. GET `/api/hogar/pagos` devolvió los tres pagos DEMO pendientes.
- Saldo insuficiente: POST de un gasto DEMO de $1.778.001 con saldo de $1.778.000 respondió 409 `SALDO_INSUFICIENTE`; el detalle reportó saldo disponible de $1.778.000.
- Verificación local: `npm.cmd run build` correcto; `npm.cmd test` correcto (7 archivos, 48 pruebas); `npm.cmd run type-check` correcto; Prettier correcto.
- Incidencia de entorno: la primera prueba con sesión falló porque el servidor iniciado sin `NODE_EXTRA_CA_CERTS` no confiaba en la CA de Supabase (`SELF_SIGNED_CERT_IN_CHAIN`). Se reinició el servidor usando el certificado local configurado; no se desactivó la verificación TLS y las pruebas autenticadas finalizaron correctamente.
- Estado: P05 implementado y validado; fase 4 completada.

### P06 Interfaz base y catálogos

- Archivos creados: componentes reutilizables en `src/components/ui/`, navegación e insignias del hogar en `src/components/hogar/`, `src/app/hogar/layout.tsx`, `src/app/hogar/page.tsx` y `src/app/hogar/catalogos/page.tsx`.
- Archivos modificados: `src/app/globals.css`, `src/app/page.tsx`, `src/app/account/account-actions.tsx` y este registro.
- Estilos: el proyecto no tiene Tailwind instalado ni configurado; se añadieron los tokens de la sección 13 como variables CSS sin retirar los tokens ni estilos existentes.
- Funcionalidad: layout de hogar protegido por `obtenerSesion()`; panel con saldo y alertas; navegación con rutas requeridas y menú adaptable; formularios y tablas para miembros/categorías con límite mensual, estado, movimientos y acciones PATCH; errores de API expuestos al usuario y actualización con `router.refresh()`.
- Verificación autenticada: la sesión existente permitió consultar el panel. Se crearon `Prueba P06 miembro 1794065728229` y `Prueba P06 categoría 1794065728229` (límite $123.456); ambos quedaron activos. Los intentos de repetir ambos nombres respondieron 409 `NOMBRE_DUPLICADO`; desactivar y activar cada registro respondió 200. Estos registros de verificación permanecen en la base.
- Navegación móvil: a 390 px se comprobó que aparece el botón de menú y se ocultan los enlaces; a 1280 px aparecen los enlaces y se oculta el botón. El navegador integrado mantuvo el fallback `loading.tsx` y no permitió comprobar el clic/expansión del menú; el HTML del panel y la navegación sí estaban en la respuesta del servidor.
- Verificación local: `npm.cmd run type-check` correcto; `npm.cmd test` correcto (7 archivos, 48 pruebas); `npm.cmd run build` correcto. No se hizo commit.
- Estado: P06 implementado y compilado; pendiente confirmar en un navegador normal la interacción del menú móvil.

### P07 Pagos y panel de alertas

- Archivos creados: `src/components/hogar/FormularioPago.tsx`, `src/components/hogar/TablaPagos.tsx`, `src/components/hogar/TablaAlertas.tsx`, `src/app/hogar/pagos/page.tsx` y `src/app/hogar/pagos/nuevo/page.tsx`.
- Archivos modificados: `src/app/hogar/page.tsx`, `src/app/globals.css` y este registro.
- Funcionalidad: alta de pagos validada en cliente con `esquemaPago` y fecha futura en Bogotá; listado de pagos con montos abonados/restantes, urgencia solo para pendientes y acción de eliminación confirmada únicamente cuando el pago sigue pendiente y no tiene abonos; panel con saldo, alertas ordenadas y accesos rápidos.
- Aceptación autenticada con DEMO (2026-11-07): el formulario rechazó una fecha pasada mostrando “La fecha límite debe ser una fecha futura.”; el pago “P07 Demo 5 dias” (vencimiento a 5 días) apareció amarillo y “P07 Demo 1 dia” (a 1 día) rojo. Ambos se eliminaron desde la tabla con confirmación. El panel mostró las alertas rojas antes que las amarillas y los días restantes correspondientes.
- Eliminación con movimientos: se registró un abono de $100 a “P07 Pago movimiento” ($1.000, abonable). La tabla ocultó su acción de eliminar; DELETE respondió 409 `PAGO_NO_ELIMINABLE` con “Solo se puede eliminar un pago pendiente sin movimientos.” El pago pendiente y su movimiento quedan en DEMO porque los movimientos son inmutables; restante $900.
- Verificación local: `npm.cmd run build` correcto; `npm.cmd test` correcto (7 archivos, 48 pruebas); `npm.cmd run type-check` correcto; `git diff --check` sin errores.
- Estado: P07 implementado y validado. No se hizo commit.
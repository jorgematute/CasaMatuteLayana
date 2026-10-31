# Estado de ejecución · Casa Matute

| Prompt | Estado | Build | Tests | Fecha de cierre |
|---|---|---|---|---|
| P00 Auditoría | completado | correcto | correcto (2/2) | 2026-10-31 |
| P01 Base de datos | completado | correcto | correcto (2/2) | 2026-10-31 |
| P02 Reglas de negocio | completado | correcto | correcto (38/38) | 2026-10-31 |
| P03 Servidor | completado | correcto | correcto (47/47) | 2026-10-31 |
| P04 Datos | pendiente | | | |
| P05 API | pendiente | | | |
| P06 Interfaz base y catálogos | pendiente | | | |
| P07 Pagos y panel de alertas | pendiente | | | |
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
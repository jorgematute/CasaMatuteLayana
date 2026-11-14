# Casa Matute Layana

Aplicación web para que los miembros de un hogar organicen ingresos, gastos y obligaciones de pago. Construida con Next.js App Router, TypeScript, Supabase Auth, PostgreSQL, Zod y Vitest.

## Funcionalidades

- Inicio de sesión con Supabase Auth.
- Registro y consulta de ingresos y gastos por miembro y categoría.
- Asociación opcional de gastos a pagos pendientes; el servidor calcula abonos y estado del pago.
- Validación transaccional para impedir que los gastos dejen el saldo disponible del hogar en negativo.
- Registro de obligaciones, alertas por vencimiento, pagos abonables y eliminación segura de pagos sin movimientos.
- Catálogos de miembros y categorías.
- Interfaz adaptable a móvil y escritorio.

## Requisitos

- Node.js 20 o superior.
- Proyecto de Supabase con Auth y PostgreSQL.
- Variables de entorno configuradas localmente en `.env.local` y en Vercel para producción.

## Configuración y ejecución local

1. Instala dependencias y crea el archivo local de variables:

   ```powershell
   npm install
   Copy-Item .env.example .env.local
   ```

2. Completa `.env.local` con los valores de estas variables (no copies sus valores al repositorio):

   - Supabase: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` o una clave publishable compatible.
   - Nombre y versión: `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_VERSION`.
   - PostgreSQL: `CASAMATUTELAYANA_POSTGRES_URL` (y opcionalmente `CASAMATUTELAYANA_POSTGRES_URL_NON_POOLING`).
   - Certificado TLS de PostgreSQL, si hace falta: `CASAMATUTELAYANA_POSTGRES_CA_CERT`.
   - Panel administrativo, si se utiliza: `CASAMATUTELAYANA_SUPABASE_SERVICE_ROLE_KEY`.

   Para las herramientas locales de base de datos que usan el almacén de certificados de Node.js, configura `NODE_EXTRA_CA_CERTS` con la ruta del certificado de Supabase si la conexión lo requiere. No desactives la verificación TLS ni publiques claves o cadenas de conexión.

3. Aplica las migraciones, carga datos de demostración si se necesitan y arranca Next.js:

   ```bash
   npm run db:migrar
   npm run db:demo
   npm run dev
   ```

   Abre `http://localhost:3000`. Las rutas principales son `/hogar`, `/hogar/movimientos`, `/hogar/pagos` y `/hogar/catalogos`. Las cuentas de acceso se crean y administran en Supabase Auth.

## Scripts

| Comando                          | Propósito                                                                        |
| -------------------------------- | -------------------------------------------------------------------------------- |
| `npm run dev`                    | Inicia el servidor de desarrollo                                                 |
| `npm run build`                  | Compila para producción                                                          |
| `npm run start`                  | Ejecuta el build de producción                                                   |
| `npm run type-check`             | Verifica TypeScript                                                              |
| `npm test`                       | Ejecuta las pruebas Vitest                                                       |
| `npm run db:migrar`              | Aplica las migraciones pendientes                                                |
| `npm run db:verificar`           | Verifica el esquema y restricciones de PostgreSQL                                |
| `npm run db:demo`                | Reemplaza el conjunto `Demo` con datos de demostración                           |
| `npm run db:limpiar -- --prueba` | Elimina registros de prueba con prefijo `Prueba`, sin borrar los `Demo`          |
| `npm run probar:flujo`           | Ejecuta el flujo de negocio contra la base de datos y limpia sus datos de prueba |

## Arquitectura

- `src/app/`: páginas, layouts y API Route Handlers de Next.js.
- `src/components/`: componentes de interfaz y del hogar.
- `src/lib/reglas/`: reglas de negocio puras.
- `src/lib/datos/`: consultas parametrizadas y transacciones de PostgreSQL.
- `src/lib/dataService.ts`: fachada de acceso a datos para rutas y páginas.
- `src/lib/validacion/`: esquemas Zod compartidos.
- `src/lib/db/`: conexión PostgreSQL; solo `src/lib/datos/` la importa.
- `supabase/migrations/`: esquema y restricciones de base de datos.
- `scripts/`: migración, datos demo, limpieza y pruebas de flujo.
- `tests/`: pruebas unitarias de las reglas.
- `doc/`: plan técnico, estado, aceptación y cierres de fase.

## Saldo disponible

El saldo se calcula con pesos enteros y fechas del mes vigente en `America/Bogota`:

```text
saldo = ingresos del mes
      - gastos del mes
      - restante de pagos pendientes con vencimiento en el mes
```

Los abonos ya registrados se descuentan del restante del pago para no contar el mismo gasto dos veces. El servidor calcula y valida el saldo dentro de la transacción del movimiento; un gasto que lo deje negativo se rechaza.

## Reglas de negocio

| Regla                                                                                                                             | Aplicación principal                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| RN-01/RN-02: montos enteros positivos y tipo de movimiento válido                                                                 | Zod, `lib/reglas/movimiento.ts`, restricciones SQL                                    |
| RN-03: solo gastos admiten marca hormiga o pago vinculado                                                                         | Zod, regla de movimiento y restricciones SQL                                          |
| RN-04/RN-05: categoría y miembro activos                                                                                          | `lib/datos/movimientos.ts`, dentro de la transacción                                  |
| RN-06/RN-07: pagos futuros y monto positivo entero                                                                                | `lib/reglas/fechas.ts`, Zod y restricciones SQL                                       |
| RN-08: un gasto no puede dejar saldo negativo                                                                                     | `registrarMovimiento`, saldo y bloqueos dentro de una transacción                     |
| RN-09: nivel de urgencia según días restantes                                                                                     | `lib/reglas/urgencia.ts`                                                              |
| RN-10/RN-14: abonos respetan la modalidad y el restante                                                                           | `lib/reglas/vinculacion.ts` y servicio de movimientos                                 |
| RN-11/RN-12/RN-13: estado del pago se recalcula al abonar; movimientos sin vínculo no lo cambian; pagos pagados no reciben abonos | `recalcularEstadoPago` y `registrarMovimiento`                                        |
| RN-15/RN-16/RN-17: umbral de categoría y gastos hormiga                                                                           | `lib/reglas/categoria.ts`, `lib/reglas/hormiga.ts` y configuración                    |
| RN-18: umbrales centralizados                                                                                                     | `lib/config/presupuesto.ts`                                                           |
| RN-20: movimientos inmutables; solo se eliminan pagos pendientes sin movimientos                                                  | No hay rutas de edición/borrado de movimientos; `eliminarPago` y `ON DELETE RESTRICT` |
| RN-19: estado del pago independiente del nivel de urgencia                                                                        | Modelo de pagos y presentación de insignias separan estado y urgencia                 |

## Seguridad y documentación

- Las rutas privadas y de hogar requieren sesión.
- Los valores SQL se pasan mediante parámetros; no se concatenan entradas del usuario.
- Las credenciales y certificados son variables de entorno sensibles, nunca valores `NEXT_PUBLIC_*`.
- TLS de PostgreSQL mantiene la verificación de certificados habilitada.
- Consulta el [plan técnico](doc/PLAN_CASA_MATUTE.md), las [instrucciones de despliegue](docs/deploy.md) y el [registro de aceptación](doc/ACEPTACION.md).

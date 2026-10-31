# Estado actual del repositorio · Casa Matute

Auditoría P00 realizada el 2026-10-31. No se copiaron valores de variables de entorno.

## 1. Versiones

Versiones declaradas en `package.json` (se conserva el rango o etiqueta tal como está declarado):

| Paquete | Declaración |
|---|---|
| `next` | `latest` |
| `react` | `latest` |
| `typescript` | `latest` |
| `tailwindcss` | No existe |
| `pg` | No existe |
| `zod` | `latest` |
| `@supabase/supabase-js` | `^2.117.2` |
| `jose` | No existe |
| `bcryptjs` | No existe |
| `vitest` | `latest` |

La compilación identificó Next.js `16.3.5` instalado.

## 2. Scripts de `package.json`

| Script | Comando |
|---|---|
| `dev` | `next dev` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `next lint` |
| `format` | `prettier --write "src/**/*.{ts,tsx,css}"` |
| `type-check` | `tsc --noEmit` |
| `test` | `vitest run` |
| `test:watch` | `vitest` |
| `test:coverage` | `vitest run --coverage` |

No hay scripts de base de datos o migración.

## 3. Estructura

El proyecto sí usa `src/`. Árbol de las áreas solicitadas, hasta tres niveles; `components/` no existe y `scripts/` está vacío.

```text
src/app/
├── account/ (account-actions.tsx, page.tsx, password-form.tsx)
├── admin/users/ (page.tsx, users-manager.tsx)
├── api/
│   ├── admin/users/ (route.ts, [id]/route.ts)
│   ├── auth/ (login, logout, me, password)/route.ts
│   ├── data/[collection]/route.ts
│   └── health/route.ts
├── login/page.tsx
├── notes/page.tsx
├── status/page.tsx
├── error.tsx
├── globals.css
├── layout.tsx
├── loading.tsx
├── not-found.tsx
└── page.tsx

src/lib/
├── auth/ (vacía)
├── supabase/ (admin.ts, database.ts, env.ts, server.ts)
├── errors.ts
├── logger.ts
├── types.ts
├── utils.test.ts
└── utils.ts

components/ No existe

supabase/
└── migrations/
    ├── 20261003000000_supabase_core.sql
    └── 20261003000100_admin_users.sql

scripts/ (vacía)
```

## 4. Alias de importación

Definidos en `tsconfig.json` y también en `vitest.config.ts`:

- `@/*` → `./src/*`
- `@data/*` → `./data/*`

Para módulos de `src/lib/`, el prefijo es `@/lib/`.

## 5. Autenticación

- Archivos principales: `src/app/login/page.tsx`; `src/app/api/auth/login/route.ts`; rutas `logout`, `me` y `password` bajo `src/app/api/auth/`; `src/lib/supabase/server.ts`; `src/lib/supabase/env.ts`; `src/proxy.ts`; `src/app/account/account-actions.tsx`.
- Mecanismo: Supabase Auth con correo y contraseña (`signInWithPassword`) y cookies SSR administradas por `@supabase/ssr`. No es un JWT propio ni existe un adaptador de sesión de Casa Matute.
- Cookie: nombre predeterminado de Supabase SSR `sb-<project-ref>-auth-token` (puede dividirse en cookies por fragmentos); el nombre específico del proyecto no se determina aquí.
- Lectura de sesión: `createSupabaseServerClient().auth.getUser()` en páginas/rutas devuelve el usuario validado o `null`; `src/proxy.ts` valida claims con `auth.getClaims()`. No existe una función común `obtenerSesion()`.
- La ruta `/api/auth/me` devuelve `{ user: { id, email, name } }` en `data` cuando hay usuario; sin sesión responde 401.
- Página de login: `/login` (`src/app/login/page.tsx`).
- Redirección tras login: `window.location.replace('/')` en `src/app/login/page.tsx`, línea 38. La página `/` redirige al login sin usuario (`src/app/page.tsx`, línea 9). El plan indica que, más adelante, el destino será `/hogar`.
- Protección: existe `src/proxy.ts`; su `matcher` es `['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']`. Protege `/`, `/notes`, `/status`, `/admin` y `/account` redirigiendo a `/login`; no incluye aún `/hogar`.
- Cierre: `AccountActions` hace POST a `/api/auth/logout`; esa ruta ejecuta `supabase.auth.signOut()`. El cliente redirige a `/login` tras éxito.

## 6. Acceso a datos

- Clientes Supabase: `src/lib/supabase/server.ts` crea el cliente SSR con `createServerClient`; `src/lib/supabase/admin.ts` crea un cliente administrativo con `createClient` y la clave de servicio. `src/lib/supabase/database.ts` contiene operaciones sobre `app_records` y recibe un cliente Supabase.
- `pg` no está declarado en `package.json`; no existe pool de `pg` ni archivo `lib/db/conexion.ts`.

## 7. Migraciones

- Carpeta: `supabase/migrations/`.
- Archivos y numeración: `20261003000000_supabase_core.sql` y `20261003000100_admin_users.sql` (prefijo de fecha/hora creciente).
- No se encontró una tabla de control de migraciones declarada en esos archivos, ni configuración de Supabase CLI en la raíz inspeccionada.
- No existe script ni página que aplique migraciones. `package.json` no define tarea de migración y `scripts/` está vacío.
- Por tanto, el mecanismo de ejecución existente es **ninguno verificable**. Según el plan, P01 deberá establecer `npm run db:migrar` si no se incorpora antes un runner existente.

## 8. Variables de entorno

Solo se consignan nombres.

`.env.local`:

- `CASAMATUTELAYANA_POSTGRES_DATABASE`
- `CASAMATUTELAYANA_POSTGRES_HOST`
- `CASAMATUTELAYANA_POSTGRES_PASSWORD`
- `CASAMATUTELAYANA_POSTGRES_PRISMA_URL`
- `CASAMATUTELAYANA_POSTGRES_URL`
- `CASAMATUTELAYANA_POSTGRES_URL_NON_POOLING`
- `CASAMATUTELAYANA_POSTGRES_USER`
- `CASAMATUTELAYANA_SUPABASE_JWT_SECRET`
- `CASAMATUTELAYANA_SUPABASE_PUBLISHABLE_KEY`
- `CASAMATUTELAYANA_SUPABASE_SECRET_KEY`
- `CASAMATUTELAYANA_SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CASAMATUTELAYANA_CASAMATUTELAYANASUPABASE_ANON_KEY`
- `NEXT_PUBLIC_CASAMATUTELAYANA_CASAMATUTELAYANASUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_CASAMATUTELAYANA_CASAMATUTELAYANASUPABASE_URL`

`.env.example`:

- `CASAMATUTELAYANA_SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_VERSION`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NODE_ENV`

Hay conexión directa a Postgres disponible en `.env.local`: `CASAMATUTELAYANA_POSTGRES_URL` usa el puerto 6543; `CASAMATUTELAYANA_POSTGRES_PRISMA_URL` también usa 6543. La variable `CASAMATUTELAYANA_POSTGRES_URL_NON_POOLING` usa 5432. Para `lib/db/conexion.ts`, usar `CASAMATUTELAYANA_POSTGRES_URL` (pooler transaccional, puerto 6543). No se verificó la configuración de variables del proyecto en Vercel.

`.env.local` está excluido por `.gitignore`.

## 9. Estilos

- Tailwind CSS: no está instalado/declarado ni se encontró configuración; no hay versión.
- CSS global: `src/app/globals.css`.
- Fuentes: Google Fonts importadas desde CSS, `Space Grotesk` y `DM Mono`; no se usa `next/font`.
- Tokens existentes: `--ink`, `--muted`, `--paper`, `--cream`, `--lime`, `--coral`, `--line`.
- Librería de íconos: no existe una declarada en `package.json`.

## 10. Pruebas

Framework: Vitest (`vitest.config.ts`, entorno `jsdom`, setup `src/test/setup.ts`). Hay una prueba existente, `src/lib/utils.test.ts`. El comando configurado es `npm test` (`vitest run`). En P00 pasó 1 archivo y 2 pruebas; Vite mostró una advertencia de configuración futura, sin fallas.

## 11. Conflictos con el plan

- `src/app/hogar`: No existe.
- `src/app/api/hogar`: No existe.
- `src/lib/dataService.ts`: No existe.
- `components/ui`: No existe; tampoco existe `components/`.
- `src/app/page.tsx`: contenido propio de Casa Matute (inicio autenticado con navegación a Notas, Estado, Cuentas y API Health); no es la plantilla de Next.js. No se debe reemplazar como plantilla.
- Tablas de presupuesto `miembros`, `categorias`, `movimientos` y `pagos`: no aparecen en las migraciones versionadas. El SQL versionado define `public.users` y `public.app_records`, no las cuatro tablas del plan. No se consultó la base remota, así que su estado remoto queda sin verificar.
- Columnas de las cuatro tablas del plan: No existe información local porque no están definidas en las migraciones versionadas.
- El proyecto actual sí contempla cuentas admin (`users.is_admin`) y miembros de hogar (`users.is_household_member`), mientras que el plan del módulo nuevo declara que no habrá roles diferenciados. P01/P03 deben evitar alterar el login y aclarar el límite entre permisos de la app existente y el módulo presupuestal.
- Las migraciones existentes usan Supabase Auth y acceso mediante Supabase; el plan presupuestal requiere conexión de servidor `pg` y transacciones. El paquete `pg` aún no está instalado.

## 12. Decisiones derivadas

- Ruta de login existente: `/login`.
- Protección de rutas: `src/proxy.ts` ya existe (Next.js 16); su matcher actual no cubre `/hogar`.
- Migraciones: no existe runner local. Seguir el plan y crear `npm run db:migrar` en P01, salvo que antes se establezca un mecanismo compatible y verificable.
- Variable para `conexion.ts`: `CASAMATUTELAYANA_POSTGRES_URL` (puerto 6543).
- Nombres de migración propuestos, continuando la numeración observada:
  - M1: `20261003000200_casamatute_tablas.sql`
  - M2: `20261003000300_casamatute_vista_seguridad.sql`
- Prefijo de imports para `lib`: `@/lib/`.
- La credencial expuesta mencionada en la sección 2 del plan no se puede verificar desde el repositorio. Debe cambiarse y confirmarse antes de iniciar P01.

## 13. Compilación de base

- Dependencias instaladas: sí, `node_modules/` ya existía; no se ejecutó `npm install`.
- Comando: `npm.cmd run build` (PowerShell en Windows).
- Resultado: correcto, código de salida 0. Next.js 16.3.5 compiló la aplicación, completó TypeScript, generó 14 páginas estáticas y finalizó la optimización. Se detectaron las rutas existentes de la aplicación y `Proxy (Middleware)`.
- Pruebas: `npm.cmd test` correcto, 1 archivo y 2 pruebas aprobados; se emitió una advertencia de Vite sobre la carga futura de configuración, sin fallas.
# Fase 0 completada · Casa Matute

Fecha: 2026-10-31

## Compilación

`npm.cmd run build`: correcta, código de salida 0. Next.js 16.3.5 compiló, completó la comprobación de TypeScript y finalizó la generación de rutas. `node_modules/` ya existía, por lo que no fue necesario ejecutar `npm install`.

`npm.cmd test`: correcto, 1 archivo y 2 pruebas aprobados. Vite emitió una advertencia informativa sobre la carga futura de configuración.

## Conexión a Postgres

Existe en `.env.local` la variable `CASAMATUTELAYANA_POSTGRES_URL`, configurada para el puerto 6543 del pooler transaccional. Esa es la elegida para `lib/db/conexion.ts`. No se imprimieron ni documentaron valores. La presencia de la variable en Vercel no se pudo verificar; debe comprobarse antes de P01.

## Mecanismo de login

Supabase Auth con correo y contraseña, cookies SSR gestionadas por `@supabase/ssr`. Archivos principales: `src/app/login/page.tsx`, `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`, `src/lib/supabase/server.ts` y `src/proxy.ts`. La página de login es `/login`; actualmente, al iniciar sesión redirige a `/`. No se modificó el login.

## Decisiones derivadas

- Protección: conservar `src/proxy.ts` y añadir la protección de `/hogar` cuando corresponda.
- Migraciones: no hay runner local; seguir el plan creando `npm run db:migrar` en P01.
- Variable para la conexión: `CASAMATUTELAYANA_POSTGRES_URL` (puerto 6543).
- Nombres propuestos continuando la numeración versionada: M1 `20261003000200_casamatute_tablas.sql`; M2 `20261003000300_casamatute_vista_seguridad.sql`.
- Prefijo de imports para `lib`: `@/lib/`.
- La ruta `/` contiene una página propia y no debe tratarse como plantilla de Next.js.

## Puerta de seguridad

La sección 2 del plan exige cambiar la credencial funcional que fue expuesta antes de continuar. Ese cambio no se puede confirmar desde este repositorio; debe confirmarse antes de iniciar P01. También debe verificarse la variable de conexión en la configuración de Vercel.
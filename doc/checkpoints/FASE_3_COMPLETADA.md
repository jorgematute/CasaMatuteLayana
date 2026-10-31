# Fase 3 completada · Infraestructura del servidor

## Resultado

- Pool PostgreSQL configurado con `CASAMATUTELAYANA_POSTGRES_URL`, parsers para DATE, TIMESTAMP y BIGINT y transacciones con rollback.
- Conexiones PostgreSQL con verificación de certificados TLS habilitada tanto en la aplicación como en el helper de scripts.
- Adaptador de sesión implementado sobre Supabase Auth SSR; `exigirSesion()` responde mediante `ErrorDeNegocio('NO_AUTORIZADO')`.
- Proxy protege las páginas y API de `/hogar`; sin sesión, las páginas redirigen al login y la API responde 401 con el formato común.
- Respuestas HTTP, traducción de errores, lectura de cuerpos Zod, esquemas, tipos inferidos y formateadores implementados.
- GET `/api/hogar/sesion` añadido con respuesta dinámica y validación de sesión.
- `npm run build`: correcto.
- `npm test`: correcto (7 archivos, 47 pruebas).

## Verificación manual

- Sin sesión, GET `http://localhost:3000/api/hogar/sesion` respondió 401 con `Cache-Control: no-store` y `NO_AUTORIZADO`.
- El usuario confirmó que el login redirige a `/hogar` y que, con sesión, GET `/api/hogar/sesion` responde 200.
- `/hogar` puede mostrar 404 hasta que P06 implemente la interfaz.
- El puerto 3000 ya tenía un servidor Next.js del repositorio activo. El intento de iniciar otro `npm run dev` detectó el proceso existente y no lo detuvo; las comprobaciones se hicieron sobre ese servidor.

## Resumen del diff del login y la protección

- `src/app/login/page.tsx`: el único cambio es el destino tras el login exitoso, de `/` a `/hogar`. No se modificaron los handlers de autenticación ni la configuración de Supabase Auth.
- `src/proxy.ts`: conserva el matcher existente y agrega `/hogar/:path*` y `/api/hogar/:path*`; protege `/hogar` con redirección al login y responde 401 JSON `NO_AUTORIZADO`, sin redirección, para `/api/hogar` cuando falta la sesión.

## Archivos principales

- Nuevos: `src/lib/db/conexion.ts`, `src/lib/auth/sesion.ts`, `src/lib/http/respuestas.ts`, `src/lib/validacion/esquemas.ts`, `src/lib/formato.ts` y `src/app/api/hogar/sesion/route.ts`.
- Pruebas nuevas: `tests/infraestructura.test.ts`.
- Registro actualizado: `doc/ESTADO_EJECUCION.md`.

## Revisión de seguridad previa al push

- Se detectó y corrigió la desactivación de la verificación TLS en el pool de `pg` y en `scripts/conexion-bd.mjs`; ambas configuraciones ahora establecen `rejectUnauthorized: true`.
- La sección 10.7 de `doc/PLAN_CASA_MATUTE.md` se actualizó para documentar la verificación de certificados.
- La auditoría de npm reportó seis familias de advisories altas en dependencias y advisories críticos de Next.js. Se actualizaron `brace-expansion` a 1.1.21 / 5.0.12, `sharp` a 0.35.5, `source-map-js` a 1.2.2, `undici` a 8.12.3, `vite` a 8.3.5, `zod` a 4.6.7 y `next` a 16.4.3; solo cambió el lockfile para estas versiones.
- Después de actualizar, `npm audit` informó 0 altas, 0 críticas y 16 moderadas. No se usó `--force` porque npm propone una degradación incompatible de ESLint.
- Build y pruebas repetidos con las versiones actualizadas: correctos (7 archivos, 47 pruebas).
- No se hizo push: hay cambios sin commit y la política del proyecto reserva el commit al estudiante.

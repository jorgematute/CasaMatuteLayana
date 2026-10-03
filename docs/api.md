# API

- `GET /api/health`: estado, versión, entorno y uptime.
- `GET /api/data/:collection`: lista registros Supabase; acepta `id`, `limit`, `offset`, `sortBy` y `sortOrder`. Requiere sesión.
- `POST /api/data/:collection`: crea un registro validado por Zod en `app_records`. Requiere sesión.
- `PUT /api/data/:collection`: actualiza `{ id, ...fields }` en Supabase. Requiere sesión.
- `DELETE /api/data/:collection?id=...`: elimina un registro de Supabase. Requiere sesión.
- `POST /api/auth/login`: valida credenciales con Supabase Auth y mantiene sesión SSR en cookies seguras.
- `GET /api/auth/me`: devuelve el usuario autenticado por Supabase.
- `POST /api/auth/logout`: cierra la sesión de Supabase.
- `GET /api/admin/users`: lista perfiles; requiere sesión con `is_admin = true`.
- `POST /api/admin/users`: crea usuario confirmado en Supabase Auth y su perfil; requiere administrador.
- `PUT /api/admin/users/:id`: actualiza correo, nombre, permisos y, opcionalmente, contraseña; requiere administrador.

Las respuestas exitosas usan `{ success: true, data, timestamp }`; los errores usan `{ success: false, error, code, timestamp }`.

Las contraseñas se validan mediante Supabase Auth (`auth.users`); `public.users` contiene el perfil vinculado por UUID y se sincroniza al crear una cuenta. Los registros de las colecciones Zod se guardan en `public.app_records` como JSONB. RLS restringe cada perfil a su usuario y el presupuesto a integrantes aprobados (`is_household_member = true`). La migración está en `supabase/migrations/`.

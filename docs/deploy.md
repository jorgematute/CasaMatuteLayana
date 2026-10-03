# Deploy

Instala Node.js 20+, ejecuta `npm ci`, `npm run type-check`, `npm run lint`, `npm run test` y `npm run build`. En Vercel configura `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_VERSION`, `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (o la publishable key).

Antes del primer despliegue, aplica en orden `supabase/migrations/20261003000000_supabase_core.sql` y `supabase/migrations/20261003000100_admin_users.sql` en el SQL Editor de Supabase. Crea y confirma las cuentas en Authentication. Para autorizar al primer administrador, ejecuta `update public.users set is_household_member = true, is_admin = true where email = 'correo@ejemplo.com';`. El panel de cuentas usa `CASAMATUTELAYANA_SUPABASE_SERVICE_ROLE_KEY` exclusivamente en el servidor; no uses claves `service_role` o `secret` en variables `NEXT_PUBLIC_*`.

# Esquemas y datos iniciales

Los esquemas Zod viven en `_schema/`. La persistencia de ejecución está en Supabase: las colecciones se guardan en `public.app_records` y las cuentas en Supabase Auth con perfil en `public.users`.

Los JSON de esta carpeta son datos de referencia locales y no son leídos ni escritos por la aplicación. La migración inicial de Supabase se encuentra en `supabase/migrations/`.

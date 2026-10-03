# Módulos

Un módulo reúne `types.ts`, `schema.ts`, `service.ts`, componentes y pruebas. Para agregar una entidad:

1. Crea su esquema en `data/_schema/` extendiendo `baseRecordSchema`.
2. Registra el esquema en `registry.ts`.
3. Añade o actualiza el esquema SQL de `public.app_records` mediante una migración Supabase si el módulo requiere columnas dedicadas; los registros genéricos se guardan en JSONB.
4. Expón operaciones de negocio desde `src/modules/<nombre>/service.ts`.
5. Conecta la vista a `/api/data/<coleccion>` usando `useCollection`.

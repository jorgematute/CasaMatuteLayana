# Capa de datos JSON

Cada archivo representa una colección y contiene `_meta` y `records`. Los esquemas Zod viven en `_schema/`; las copias de seguridad se escriben en `_backups/` y no se versionan.

En producción Vercel mantiene el sistema en modo solo lectura porque el filesystem serverless es efímero. Para escritura persistente, configure un adapter KV antes de publicar.

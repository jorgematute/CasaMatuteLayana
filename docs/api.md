# API

- `GET /api/health`: estado, versión, entorno y uptime.
- `GET /api/data/:collection`: lista registros; acepta `id`, `limit`, `offset`, `sortBy` y `sortOrder`.
- `POST /api/data/:collection`: crea un registro validado por Zod.
- `PUT /api/data/:collection`: actualiza `{ id, ...fields }`.
- `DELETE /api/data/:collection?id=...`: elimina un registro.

Las respuestas exitosas usan `{ success: true, data, timestamp }`; los errores usan `{ success: false, error, code, timestamp }`.

# Deploy

Instala Node.js 20+, ejecuta `npm ci`, `npm run type-check`, `npm run lint`, `npm run test` y `npm run build`. En Vercel configura `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_VERSION` y un `JWT_SECRET` real.

El adaptador local usa archivos JSON. Vercel debe operar en lectura hasta conectar un almacenamiento persistente como Vercel KV; el motor devuelve `READ_ONLY` para escrituras en producción.

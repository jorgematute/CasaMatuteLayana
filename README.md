# Casa Matute Layana

Sistema fullstack TypeScript para organizar el presupuesto del hogar. Usa Next.js App Router, Supabase Auth, PostgreSQL/Supabase para persistencia, validación Zod y una interfaz responsive.

## Inicio

Requiere Node.js 20 o superior.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Abre `http://localhost:3000`. Las rutas principales son `/`, `/notes`, `/status`, `/api/health` y `/api/data/note`.

## Calidad

```bash
npm run type-check
npm run lint
npm run test
npm run build
```

## Arquitectura

- `src/app`: páginas y Route Handlers.
- `src/lib/supabase/`: clientes SSR y persistencia Supabase.
- `supabase/migrations/`: esquema SQL, perfiles, registros JSONB y políticas RLS.
- `data/_schema/`: esquemas Zod para validar colecciones.
- `src/modules`: lógica de dominio, actualmente notas.
- `src/hooks/use-collection.ts`: consumo reutilizable de colecciones.
- `.github/workflows/ci.yml`: type-check, lint, tests y build.

La persistencia en filesystem es apropiada para desarrollo local. Antes de activar escrituras en Vercel hay que conectar un adapter persistente, tal como describe `docs/deploy.md`.
# Casa Matute · Instrucciones para Copilot

## Documentos rectores
- Plan técnico: doc/PLAN_CASA_MATUTE.md. Si una instrucción contradice el plan, prevalece el plan.
- Estado real del repositorio: doc/ESTADO_ACTUAL.md.
- Avance: doc/ESTADO_EJECUCION.md. Se actualiza al final de cada tarea.

## Stack
- Next.js App Router + TypeScript + Tailwind CSS. Despliegue en Vercel.
- Postgres de Supabase con el paquete pg y la variable CASAMATUTELAYANA_POSTGRES_URL.
- Validación con Zod. Pruebas con Vitest.
- Login existente: Supabase Auth con cookies SSR; src/app/api/auth/login/route.ts, src/app/api/auth/logout/route.ts, src/lib/supabase/server.ts y src/proxy.ts. No se reescribe. Sin roles: todo usuario con sesión es un miembro.

## Convenciones
- Identificadores, comentarios, mensajes y textos de interfaz en español.
- Reglas de negocio solo en lib/reglas/: funciones puras, sin pg, sin variables de entorno y sin leer el reloj (excepto fechas.ts).
- Los umbrales (días de urgencia, 90 % de categoría, umbral hormiga) se leen de lib/config/presupuesto.ts.
- Las comparaciones de porcentaje usan aritmética entera; nunca limite * 0.9 con decimales.
- Solo lib/datos/ importa lib/db/conexion.ts. Rutas y páginas importan datos únicamente desde lib/dataService.ts.
- Toda ruta en app/api/hogar/ llama await exigirSesion() como primera instrucción.
- El saldo y el estado del pago se calculan DENTRO de la transacción del movimiento, con los pagos bloqueados (FOR UPDATE).
- Entradas validadas con los esquemas de lib/validacion/esquemas.ts.
- Errores de negocio con ErrorDeNegocio(codigo); respuestas con lib/http/respuestas.ts.
- Montos en pesos enteros. Nunca decimales.
- Fechas 'YYYY-MM-DD' como texto entre capas. Zona horaria America/Bogota; "hoy" solo con hoyBogota().
- En rutas dinámicas params es una Promise: const { id } = await params.
- SQL siempre con parámetros ($1, $2). Nunca concatenar valores.
- Los movimientos no se editan ni se eliminan. Un pago se elimina solo si está pendiente y sin movimientos.
- No instalar librerías de componentes (shadcn, MUI u otras). Usar components/ui/.
- Prefijo de imports para lib: @/lib/.
- Archivo de protección de rutas: src/proxy.ts. Ruta de login: /login.

## Al terminar cada tarea
1. npm run build sin errores.
2. npm test sin fallas (desde que exista Vitest).
3. Actualizar doc/ESTADO_EJECUCION.md.
4. No hacer commit: el estudiante revisa y hace el commit.
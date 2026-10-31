# Casa Matute · Prompts para GitHub Copilot

> Plan de referencia: `doc/PLAN_CASA_MATUTE.md`
> Herramienta: GitHub Copilot Chat en modo Agente (VS Code)
> Punto de partida: proyecto desplegado en Vercel, Supabase conectado y login funcionando

---

## Antes de empezar: seguridad

El plan funcional entregado tenía un correo y una contraseña reales. Antes de ejecutar P00:

1. Cambiar la contraseña de la cuenta expuesta en el sistema de login.
2. Confirmar que `.env.local` está en `.gitignore`.
3. No volver a pegar credenciales en la entrega.

No continuar con P00 hasta hacerlo.

## Cómo ejecutar estos prompts

1. Crear la carpeta `doc/` en la raíz del repositorio (si no existe) y copiar allí `PLAN_CASA_MATUTE.md` y `PROMPTS_CASA_MATUTE.md`.
2. Abrir el proyecto en VS Code y abrir Copilot Chat. En el selector de modo elegir **Agent**. En el selector de modelo elegir el más capaz disponible.
3. Cada prompt se ejecuta en una **conversación nueva** (botón `+` del chat).
4. Copiar el bloque gris completo del prompt, pegarlo en el chat y enviarlo. No hay datos que reemplazar.
5. Cuando Copilot pida permiso para ejecutar un comando en la terminal, leerlo y aceptarlo.
6. Al terminar cada prompt: revisar los cambios y aceptarlos (**Keep**); hacer la verificación indicada; hacer commit con el mensaje sugerido y `git push`. Vercel desplegará; si falla, usar el prompt de despliegue fallido antes de continuar.
7. No saltar prompts. Si algo falla, usar el prompt de corrección del final.

| Fase | Prompts |
|---|---|
| 0 · Preparación | P00 |
| 1 · Base de datos | P01 |
| 2 · Reglas de negocio | P02 |
| 3 · Servidor | P03 |
| 4 · Datos y API | P04, P05 |
| 5 · Interfaz mínima | P06, P07, P08 |
| 7 · Opcionales | P09, P10 |

---

## P00 · Auditoría del repositorio y archivos de control

**Fase:** 0 · **Modifica código:** no · **Crea:** `doc/ESTADO_ACTUAL.md`, `.github/copilot-instructions.md`, `doc/ESTADO_EJECUCION.md`, `doc/checkpoints/FASE_0_COMPLETADA.md`

````text
Actúa como ingeniero de software senior trabajando en modo agente sobre este repositorio Next.js.

Contexto: el proyecto "Casa Matute" (gestor de presupuesto del hogar) ya está desplegado en Vercel, conectado a Supabase y tiene login funcionando. El plan técnico está en doc/PLAN_CASA_MATUTE.md. Este prompt NO implementa funcionalidades: audita el repositorio y crea los archivos de control.

Lee completo doc/PLAN_CASA_MATUTE.md, en especial las secciones 0, 1, 2, 4, 10 y 17.

TAREA 1. Crea doc/ESTADO_ACTUAL.md con estas secciones, llenas con lo que encuentres. No supongas: si algo no existe, escribe "No existe".
1. Versiones (package.json): next, react, typescript, tailwindcss, pg, zod, @supabase/supabase-js, jose, bcryptjs, vitest.
2. Scripts de package.json.
3. Estructura: árbol de app/, lib/, components/, supabase/ y scripts/ hasta 3 niveles. Indica si usa carpeta src/.
4. Alias de importación en tsconfig.json.
5. Autenticación: archivos; mecanismo (JWT propio en cookie, Supabase Auth u otro); nombre de la cookie; función que lee la sesión y qué devuelve; ruta de la página de login; ruta a la que redirige después del login (archivo y línea); archivo de middleware o proxy y su matcher; cómo se cierra sesión.
6. Acceso a datos: clientes de Supabase existentes (archivos), uso del paquete pg, archivo de pool si existe.
7. Migraciones: carpeta, archivos existentes y su numeración, tabla de control, script o página que las aplica.
8. Variables de entorno: solo los NOMBRES presentes en .env.local y .env.example (NUNCA copies valores). Indica si existe una cadena de conexión directa a Postgres (DATABASE_URL, POSTGRES_URL o similar) y con qué nombre; es la que usará lib/db/conexion.ts.
9. Estilos: versión de Tailwind, ubicación de globals.css, fuentes, tokens de color existentes, librería de íconos.
10. Pruebas: framework existente.
11. Conflictos con el plan: existencia previa de app/hogar, app/api/hogar, lib/dataService.ts y components/ui; contenido de app/page.tsx (plantilla de Next.js o propio); tablas existentes llamadas miembros, categorias, movimientos, pagos y, si existen, sus columnas.
12. Decisiones derivadas:
    - Ruta de la página de login.
    - Archivo de protección de rutas (proxy.ts en Next.js 16, middleware.ts antes) y si ya existe.
    - Mecanismo de migraciones a usar.
    - Nombre de la variable de conexión a Postgres que usará conexion.ts.
    - Nombres exactos que tendrán M1 y M2 continuando la numeración existente.
    - Prefijo de imports para lib (por ejemplo @/lib o @/src/lib).
13. Compilación de base: resultado de npm run build (TAREA 4).

TAREA 2. Crea .github/copilot-instructions.md reemplazando [AJUSTAR] con lo hallado:

```markdown
# Casa Matute · Instrucciones para Copilot

## Documentos rectores
- Plan técnico: doc/PLAN_CASA_MATUTE.md. Si una instrucción contradice el plan, prevalece el plan.
- Estado real del repositorio: doc/ESTADO_ACTUAL.md.
- Avance: doc/ESTADO_EJECUCION.md. Se actualiza al final de cada tarea.

## Stack
- Next.js App Router + TypeScript + Tailwind CSS. Despliegue en Vercel.
- Postgres de Supabase con el paquete pg y la variable [AJUSTAR: nombre de la variable de conexión].
- Validación con Zod. Pruebas con Vitest.
- Login existente: [AJUSTAR: mecanismo y archivos]. No se reescribe. Sin roles: todo usuario con sesión es un miembro.

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
- Prefijo de imports para lib: [AJUSTAR].
- Archivo de protección de rutas: [AJUSTAR]. Ruta de login: [AJUSTAR].

## Al terminar cada tarea
1. npm run build sin errores.
2. npm test sin fallas (desde que exista Vitest).
3. Actualizar doc/ESTADO_EJECUCION.md.
4. No hacer commit: el estudiante revisa y hace el commit.
```

TAREA 3. Crea doc/ESTADO_EJECUCION.md:

```markdown
# Estado de ejecución · Casa Matute

| Prompt | Estado | Build | Tests | Fecha de cierre |
|---|---|---|---|---|
| P00 Auditoría | pendiente | | | |
| P01 Base de datos | pendiente | | | |
| P02 Reglas de negocio | pendiente | | | |
| P03 Servidor | pendiente | | | |
| P04 Datos | pendiente | | | |
| P05 API | pendiente | | | |
| P06 Interfaz base y catálogos | pendiente | | | |
| P07 Pagos y panel de alertas | pendiente | | | |
| P08 Movimientos y aceptación | pendiente | | | |
| P09 Opcionales: saldo y categorías | pendiente | | | |
| P10 Opcionales: resumen y hormiga | pendiente | | | |

## Bitácora

Cada prompt agrega una sección con: archivos creados, archivos modificados, comandos ejecutados y su resultado, problemas y cómo se resolvieron, pendientes.
```

TAREA 4. Si no existe node_modules, ejecuta npm install. Luego npm run build y registra el resultado en la sección 13 de ESTADO_ACTUAL.md. Si falla, NO corrijas: describe el error.

TAREA 5. Confírmame que entiendes que la credencial del plan funcional debe haberse cambiado antes de seguir (sección 2 del plan). Si la variable de conexión directa a Postgres no existe en .env.local, explícame cómo obtenerla en Supabase (Connect, Transaction pooler, puerto 6543, reemplazar la contraseña) y agregarla a .env.local y a Vercel. No continuar con P01 sin ella.

RESTRICCIONES: no modifiques código, configuración ni dependencias. Solo crea los archivos de este prompt.

AL TERMINAR:
- Crea doc/checkpoints/FASE_0_COMPLETADA.md con: resultado de la compilación, existencia de la variable de conexión, mecanismo de login, decisiones derivadas.
- Marca P00 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen y los riesgos para los siguientes prompts.
````

**Verificación del estudiante:** abrir `doc/ESTADO_ACTUAL.md` y confirmar que la sección 5 describe el login real y que la 8 identifica la variable de conexión a Postgres.

**Commit sugerido:** `docs: auditoría del repositorio y archivos de control para Copilot`

---

## P01 · Base de datos del módulo

**Fase:** 1 · **Crea:** dos migraciones, `scripts/verificar-bd.mjs` y, si hace falta, `scripts/migrar.mjs`

````text
Antes de escribir código lee completos: doc/PLAN_CASA_MATUTE.md (secciones 4, 8 y 15), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md.

OBJETIVO: crear y aplicar las dos migraciones y dejar un script que demuestre que la base de datos protege las reglas.

TAREA 1. Si ESTADO_ACTUAL.md reporta tablas previas llamadas miembros, categorias, movimientos o pagos que NO correspondan a este plan, detente y avísame. Si no hay conflicto, crea en supabase/migrations/ dos archivos con los nombres de la sección 12 de ESTADO_ACTUAL.md:
- Migración M1 (tablas) con el SQL exacto de la sección 8.2 del plan.
- Migración M2 (vista y seguridad) con el SQL exacto de la sección 8.3.
No cambies nombres de tablas, columnas ni restricciones: el código posterior depende de ellos (sección 8.4).

TAREA 2. Aplica las migraciones:
- Si ESTADO_ACTUAL.md indica un mecanismo existente, úsalo y explícalo.
- Si no:
  a) Instala pg y @types/pg si faltan.
  b) Crea scripts/migrar.mjs que lea la variable de conexión indicada; se conecte con ssl { rejectUnauthorized: false }; cree _migrations (id serial primary key, archivo text unique not null, aplicada_en timestamptz default now()) si no existe; recorra supabase/migrations/*.sql en orden alfabético; aplique en una transacción cada archivo no registrado y lo registre; imprima "aplicada" u "omitida"; termine con código 1 si algo falla.
  c) Si hay migraciones anteriores del login ya aplicadas, regístralas en _migrations sin ejecutarlas y explícalo.
  d) Agrega "db:migrar": "node --env-file=.env.local scripts/migrar.mjs" y ejecútalo. Usa el nombre real de la variable de conexión.

TAREA 3. Crea scripts/verificar-bd.mjs y "db:verificar". Debe imprimir:
1. Existencia (sí/no) de miembros, categorias, pagos, movimientos, eventos_presupuesto y de la vista v_pagos.
2. Número de filas de cada tabla.
3. Restricciones de movimientos y pagos (pg_constraint) e índices únicos (pg_indexes).
4. Si RLS está activo en las cinco tablas (pg_class.relrowsecurity).
5. Pruebas de integridad en UNA transacción que SIEMPRE termina en ROLLBACK, con SAVEPOINT antes de cada caso que debe fallar:
   a) Insertar miembro "Verif", categoría "Verif Cat" (límite 100000) y pago "Verif Pago" (monto 200000, fecha futura, pendiente): funcionan.
   b) Insertar movimiento tipo 'gasto' monto 0: debe fallar con 23514 (RN-01).
   c) Insertar movimiento tipo 'transferencia': debe fallar con 23514 (RN-02).
   d) Insertar movimiento tipo 'ingreso' con es_hormiga true: debe fallar con 23514 (RN-03).
   e) Insertar movimiento tipo 'ingreso' con pago_pendiente_id del pago del caso a: debe fallar con 23514 (RN-03).
   f) Insertar pago con monto -1: debe fallar con 23514.
   g) Insertar un segundo miembro "verif" (minúscula): debe fallar con 23505 (ux_miembros_nombre).
   h) Insertar un movimiento 'gasto' válido vinculado al pago, 120000; comprobar en v_pagos que abonado = 120000 y restante = 80000.
   Imprime "OK" o "FALLA" por caso.
6. Total de fallas; termina con código 1 si hubo alguna.

Ejecuta npm run db:verificar y copia la salida en la bitácora.

RESTRICCIONES: no modifiques archivos del login ni de app/. No crees tablas distintas a las del plan.

AL TERMINAR:
- npm run build sin errores.
- Crea doc/checkpoints/FASE_1_COMPLETADA.md con la salida de npm run db:verificar.
- Marca P01 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** en Supabase, Table Editor, deben aparecer `miembros`, `categorias`, `pagos`, `movimientos` y `eventos_presupuesto`. La salida de `npm run db:verificar` no debe tener líneas con FALLA.

**Commit sugerido:** `feat(bd): tablas, vista de pagos y restricciones de Casa Matute`

---

## P02 · Reglas de negocio y pruebas unitarias

**Fase:** 2 · **Crea:** `lib/config/presupuesto.ts`, `lib/reglas/*`, `tests/reglas/*`, `vitest.config.ts`

````text
Antes de escribir código lee completos: doc/PLAN_CASA_MATUTE.md (secciones 5, 6, 9, 10.3, 10.4, 10.5, 11.2, 14 y 16.1), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md.

OBJETIVO: implementar las reglas como funciones puras y probarlas con Vitest. Incluye las reglas de los módulos opcionales (categoría y hormiga), porque son puras y baratas de probar desde ahora.

TAREA 1. Instala vitest (desarrollo). Agrega "test": "vitest run" y "test:ver": "vitest". Crea vitest.config.ts con environment 'node', include ['tests/**/*.test.ts'] y el alias '@' de tsconfig.json.

TAREA 2. Crea lib/config/presupuesto.ts con el contenido exacto de la sección 10.4.

TAREA 3. Crea lib/reglas/ con las firmas exactas de la sección 10.5:
- errores.ts: CodigoError; MENSAJES y ESTADO_HTTP con la tabla 11.2; clase ErrorDeNegocio (name 'ErrorDeNegocio'; si no recibe mensaje usa MENSAJES[codigo] reemplazando {clave} con detalles).
- fechas.ts: hoyBogota; esFechaValida; esFechaFutura; diasRestantes (fechaLimite - hoy con Date.UTC); inicioYFinDeMes(hoy) (primer y último día del mes de hoy, como texto YYYY-MM-DD).
- movimiento.ts: validarMovimiento en el orden de la sección 10.5 (monto entero > 0; tipo válido; si es ingreso, esHormiga false y pagoPendienteId null; usa DATOS_INVALIDOS).
- urgencia.ts: NivelUrgencia; nivelUrgencia(dias) según la sección 5.2 usando DIAS_VERDE_MINIMO y DIAS_AMARILLO_MINIMO (≥8 verde; 3 a 7 amarillo; 0 a 2 rojo; <0 vencido); ORDEN_URGENCIA (vencido 0, rojo 1, amarillo 2, verde 3); ETIQUETA_URGENCIA.
- vinculacion.ts: resolverMontoVinculado (no abonable → restante; abonable → montoEnviado); validarVinculacion (abonable: montoEnviado entero > 0 o DATOS_INVALIDOS; no abonable: no valida el monto porque el servidor usa el restante); estadoTrasAbono(totalAbonado, montoPago): 'pagado' si totalAbonado >= montoPago, si no 'pendiente'.
- categoria.ts: NivelCategoria; nivelCategoria(acumulado, limite) con aritmética entera (sección 9): si limite es null o 0, 'normal'; 'rojo' si acumulado >= limite; 'amarillo' si acumulado*100 >= PORCENTAJE_CATEGORIA_AMARILLO*limite; si no, 'normal'.
- hormiga.ts: superaUmbralHormiga(acumulado) = acumulado >= UMBRAL_HORMIGA.

Ningún archivo de lib/reglas/ importa pg, next ni process.env, ni llama new Date() (excepto el parámetro por defecto de hoyBogota).

TAREA 4. Crea tests/reglas/ayudas.ts con esperarCodigo(fn, codigo).

TAREA 5. Crea las pruebas en tests/reglas/ (movimiento, urgencia, vinculacion, fechas, categoria, hormiga) cubriendo T-01 a T-33 de la sección 16.1. Cada caso con su ID en el nombre.

TAREA 6. Ejecuta npm test hasta que pasen las 33. Si una falla, corrige la regla, no la prueba, salvo que contradiga el plan; explícalo.

RESTRICCIONES: no toques app/, el login ni la base de datos.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_2_COMPLETADA.md con la salida resumida de npm test.
- Marca P02 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** ejecutar `npm test` (33 pruebas). Abrir `lib/reglas/urgencia.ts` y ver cómo los casos límite (7 días amarillo, 2 días rojo) coinciden con el plan funcional.

**Commit sugerido:** `feat(reglas): reglas de movimientos, urgencia y vinculación con pruebas`

---

## P03 · Infraestructura del servidor

**Fase:** 3 · **Crea:** conexión, sesión, respuestas, esquemas, formato y `/api/hogar/sesion` · **Modifica:** protección de rutas y redirección del login

````text
Antes de escribir código lee completos: doc/PLAN_CASA_MATUTE.md (secciones 1.3, 8.4, 10.1, 10.3, 10.7, 11.1, 11.2, 11.4, 13 y 15), doc/ESTADO_ACTUAL.md (sección 5) y doc/ESTADO_EJECUCION.md.

OBJETIVO: dejar lista la infraestructura del servidor.

TAREA 1. lib/db/conexion.ts como la sección 10.7. Si la variable de conexión no se llama DATABASE_URL, usa el nombre real que indica ESTADO_ACTUAL.md. Si ya hay un pool de pg, reutilízalo agregando los parsers.

TAREA 2. lib/auth/sesion.ts:
- obtenerSesion(): Promise<{ email: string } | null> usando el mecanismo del login descrito en ESTADO_ACTUAL.md (devuelve el correo o identificador del usuario autenticado).
- exigirSesion(): igual, pero lanza ErrorDeNegocio('NO_AUTORIZADO') si no hay sesión.
- Solo importa funciones del login; no modifica sus archivos.

TAREA 3. Protección de rutas en el archivo indicado (proxy.ts o middleware.ts): agrega /hogar/:path* y /api/hogar/:path* al matcher, conservando lo existente. Sin sesión: las páginas redirigen al login; las rutas /api/hogar responden 401 con el formato de la sección 11.1. Si no es posible en ese archivo, deja la protección en el layout de /hogar (P06) y en exigirSesion(), y anótalo.

TAREA 4. Cambia SOLO el destino de la redirección posterior al login a /hogar.

TAREA 5. lib/http/respuestas.ts: responderOk(datos, estado=200); responderError (ErrorDeNegocio → ESTADO_HTTP[codigo]; ZodError → 400 DATOS_INVALIDOS con detalles flatten; pg 23505/23503/23514 → traducir con la tabla 8.4 por error.constraint; otro → console.error y 500 ERROR_INTERNO); conManejoDeErrores(handler); leerCuerpo(request, esquema). Todas con Cache-Control: no-store.

TAREA 6. lib/validacion/esquemas.ts con los esquemas de la sección 11.4, con tipos z.infer. El esquemaMovimiento incluye el refinamiento de RN-03 (ingreso no lleva hormiga ni pago). No importa nada del servidor.

TAREA 7. lib/formato.ts: formatearPesos (Intl es-CO, COP, sin decimales), formatearFecha (Intl es-CO, dateStyle medium, timeZone UTC), formatearDiasRestantes (dias) → "Vence hoy", "Falta 1 día", "Faltan 5 días", "Venció hace 3 días".

TAREA 8. app/api/hogar/sesion/route.ts: GET con conManejoDeErrores; primera instrucción await exigirSesion(); responde { email }. export const dynamic = 'force-dynamic'.

VERIFICACIÓN: npm run build y npm test. Inicia npm run dev; sin sesión, GET /api/hogar/sesion debe dar 401. Pídeme que inicie sesión y abra http://localhost:3000/api/hogar/sesion; espera mi confirmación de que responde 200. Comprueba que el login sigue funcionando y redirige a /hogar (puede mostrar 404 hasta P06).

AL TERMINAR:
- Crea doc/checkpoints/FASE_3_COMPLETADA.md con los resultados y el diff resumido de los archivos del login o de protección que tocaste.
- Marca P03 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** iniciar sesión: debe llevar a `/hogar` (por ahora 404). Abrir `/api/hogar/sesion` con sesión: 200 con el correo. En ventana privada: 401.

**Commit sugerido:** `feat(servidor): conexión, sesión y utilidades de API`

---

## P04 · Datos: catálogos, pagos y movimientos

**Fase:** 4 (primera parte) · **Crea:** `lib/datos/*`, `lib/dataService.ts`, `scripts/limpiar-prueba.mjs`, `scripts/probar-flujo.ts`, `scripts/cargar-demo.ts`

````text
Antes de escribir código lee completos: doc/PLAN_CASA_MATUTE.md (secciones 4, 5, 6, 7, 8.4, 9, 10.5, 10.6, 14 y 16.2), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Revisa lib/reglas/, lib/db/conexion.ts y lib/validacion/esquemas.ts.

OBJETIVO: implementar el acceso a datos y los casos de uso, con transacciones, y comprobar el flujo contra la base real. El punto delicado es el cálculo de saldo (sección 4) y la vinculación a pagos.

TAREA 1. lib/datos/tipos.ts con los tipos de la sección 10.6 (DatosMovimiento, DatosPago, FilaMiembro, FilaCategoria, FilaPago, FilaMovimiento, FilaAlerta, ResultadoMovimiento, DesgloseSaldo, PanelHogar, y para opcionales FilaEstadoCategoria, ResumenAgrupado). Reutiliza los tipos de lib/reglas.

TAREA 2. lib/datos/eventos.ts: registrarEvento(tx, { tipo, detalle }).

TAREA 3. lib/datos/catalogos.ts:
- listarMiembros({ incluirInactivos }) y listarCategorias({ incluirInactivos }): orden por nombre; cada fila incluye totalMovimientos (COUNT).
- crearMiembro(nombre), crearCategoria({ nombre, limiteMensual }): nombre duplicado → NOMBRE_DUPLICADO.
- actualizarMiembro(id, cambios), actualizarCategoria(id, cambios): si no existe, error claro.
- verificarMiembroActivo(tx, id) y verificarCategoriaActiva(tx, id) (internas): MIEMBRO_INVALIDO / CATEGORIA_INVALIDA si no existe o inactivo.

TAREA 4. lib/datos/saldo.ts:
- calcularSaldo(cliente?): implementa la sección 4 exactamente. inicioYFinDeMes(hoyBogota()); suma ingresos del mes; suma gastos del mes; suma el restante de los pagos pendientes con fecha límite dentro del mes (restante = monto - abonos, usando v_pagos o un cálculo equivalente, nunca negativo por pago); saldo = ingresos - gastos - restantesPagosDelMes. Devuelve DesgloseSaldo { ingresos, gastos, pagosPendientesMes, saldo }. Acepta opcionalmente un cliente de transacción para usarse dentro de registrarMovimiento.
- calcularSaldoTrasGasto(tx, montoGasto): calcularSaldo dentro de la transacción menos el gasto que se va a insertar (equivale a saldo actual - montoGasto, ya que el gasto aún no está).

TAREA 5. lib/datos/pagos.ts:
- listarPagos({ estado }): desde v_pagos con abonado y restante; orden por fecha límite.
- crearPago(d): valida fecha futura con esFechaFutura(fechaLimite, hoyBogota()) (FECHA_NO_FUTURA); inserta pendiente.
- eliminarPago(id): solo si estado pendiente y sin movimientos vinculados (COUNT); si no, PAGO_NO_ELIMINABLE.
- obtenerAlertasVencimiento(): pagos en estado pendiente; para cada uno calcula diasRestantes y nivelUrgencia; ordena por ORDEN_URGENCIA y luego por fecha límite; devuelve FilaAlerta[].
- Funciones internas: bloquearPago(tx, id) (FOR UPDATE; PAGO_NO_ENCONTRADO), sumarAbonos(tx, pagoId), recalcularEstadoPago(tx, pagoId) (suma abonos; estadoTrasAbono; UPDATE estado; devuelve el nuevo estado).

TAREA 6. lib/datos/movimientos.ts:
- registrarMovimiento(d, miembroSesion): secuencia EXACTA de la sección 7.1 (validarMovimiento; verificar miembro y categoría; si hay pago, bloquearlo, rechazar si está pagado, calcular restante, resolverMontoVinculado y validarVinculacion; si es gasto, calcularSaldoTrasGasto y rechazar con SALDO_INSUFICIENTE si queda negativo; insertar movimiento con el monto resuelto; recalcularEstadoPago si hay pago; evento). Devuelve ResultadoMovimiento { movimiento, saldo, estadoPago }.
- listarMovimientos(filtros): por miembro, categoría y rango de fechas; orden por fecha descendente; LIMITE_LISTADO; incluye nombres de miembro y categoría y, si tiene pago, su nombre.

TAREA 7. lib/datos/resumen.ts: crea el archivo con obtenerResumen preparado para el módulo opcional (F6); en el mínimo puede devolver una estructura vacía o lanzar un error claro. obtenerEstadoCategorias y obtenerAcumuladoHormiga también se dejan preparados (se completan en P09 y P10).

TAREA 8. obtenerPanel(): arma PanelHogar con obtenerAlertasVencimiento y calcularSaldo; el acumulado hormiga se agrega en P10.

TAREA 9. lib/dataService.ts como fachada: reexporta las funciones públicas y los tipos. Verifica que ningún archivo fuera de lib/datos importe lib/db/conexion.ts.

TAREA 10. scripts/limpiar-prueba.mjs con "db:limpiar": borra (en orden movimientos, eventos, pagos, categorias, miembros) los registros cuyo nombre empiece por 'Prueba' o 'Demo' (y los pagos 'Prueba'/'Demo', y los movimientos de esos miembros). Imprime el conteo. Opciones --prueba y --demo.

TAREA 11. Instala tsx (desarrollo). Crea scripts/probar-flujo.ts con los 14 pasos de la sección 16.2 usando solo dataService. Las fechas de los movimientos son hoyBogota(). Imprime OK/FALLA por paso; limpia antes y en finally; cierra el pool; código 1 si hay fallas. "probar:flujo": "tsx --env-file=.env.local scripts/probar-flujo.ts" (o la variante con --import tsx). Ejecuta y corrige hasta 0 fallas.

TAREA 12. scripts/cargar-demo.ts con "db:demo": crea 2 miembros, 3 categorías con límite, un ingreso, varios gastos y 3 pagos con fechas límite a distintos plazos (uno a 1 día, uno a 5 días, uno vencido si el sistema lo permite creándolo y no pagándolo; si no se puede crear con fecha pasada, crea a 1 día y anótalo), de modo que el panel muestre alertas de varios niveles. Limpia los Demo antes. Imprime una tabla. Ejecútalo.

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P04 en ESTADO_EJECUCION.md y agrega la salida de probar:flujo y db:demo en la bitácora. La fase 4 sigue abierta hasta P05.
- Muéstrame un resumen.
````

**Verificación del estudiante:** `npm run probar:flujo` (14 OK, 0 fallas) y `npm run db:demo`. Revisar que el paso 7 del flujo ajusta el monto de un pago no abonable al restante.

**Commit sugerido:** `feat(datos): catálogos, pagos, movimientos y saldo con transacciones`

---

## P05 · API

**Fase:** 4 (cierre) · **Crea:** rutas de `app/api/hogar/`

````text
Antes de escribir código lee completos: doc/PLAN_CASA_MATUTE.md (secciones 11.1 a 11.4), doc/ESTADO_EJECUCION.md, lib/dataService.ts, lib/http/respuestas.ts, lib/validacion/esquemas.ts y lib/auth/sesion.ts.

OBJETIVO: exponer las operaciones del módulo mínimo.

TAREA 1. Crea las rutas de la tabla 11.3 que NO son opcionales (deja /api/hogar/saldo y /api/hogar/resumen para P09 y P10). Reglas de cada handler:
- Primera instrucción: await exigirSesion().
- conManejoDeErrores; cuerpos con leerCuerpo y los esquemas de 11.4; filtros validados.
- [id] con await params (uuid).
- export const dynamic = 'force-dynamic'.
- POST de movimientos y pagos responden 201. registrarMovimiento recibe el identificador de la sesión.
- GET /api/hogar/panel usa obtenerPanel.

TAREA 2. Verificación sin sesión: con npm run dev, GET /api/hogar/panel, GET /api/hogar/pagos y POST /api/hogar/movimientos deben dar 401.

TAREA 3. Verificación con sesión: pídeme que inicie sesión y abra /api/hogar/panel (muestra alertas y saldo de los datos DEMO) y /api/hogar/pagos. Prueba POST /api/hogar/movimientos con un gasto mayor al saldo y confirma 409 SALDO_INSUFICIENTE. Documenta.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_4_COMPLETADA.md con probar:flujo (P04) y las verificaciones.
- Marca P05 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** con sesión, abrir `/api/hogar/panel` y ver las alertas; intentar por API un gasto mayor al saldo y recibir 409.

**Commit sugerido:** `feat(api): rutas protegidas de movimientos, pagos y panel`

---

## P06 · Interfaz base, navegación y catálogos

**Fase:** 5 · **Crea:** `components/ui/*`, layout de `/hogar`, catálogos · **Modifica:** `app/globals.css` y, según el caso, `app/page.tsx`

````text
Antes de escribir código lee completos: doc/PLAN_CASA_MATUTE.md (secciones 5, 6, 12 y 13), doc/ESTADO_ACTUAL.md (secciones 5, 9 y 11), doc/ESTADO_EJECUCION.md, lib/dataService.ts y lib/formato.ts.

OBJETIVO: construir los componentes reutilizables, la navegación y la gestión de miembros y categorías.

TAREA 1. Agrega los tokens de color de la sección 13 sin borrar nada existente: con Tailwind 4 en @theme de app/globals.css; con Tailwind 3 en tailwind.config.

TAREA 2. components/ui/: Boton (primario, secundario, peligro, fantasma; prop cargando), Campo, Selector, Tarjeta, Insignia (tono neutro, primario, verde, amarillo, rojo, ingreso, gasto), Aviso (info, exito, advertencia, error), Modal (fondo oscuro, cierre con Escape y botón, foco al abrir, role dialog), EstadoVacio. Foco visible y contraste suficiente.

TAREA 3. components/hogar/:
- NavegacionHogar: barra con "Casa Matute", enlaces Panel (/hogar), Movimientos, Pagos, Catálogos (y Saldo, Resumen cuando existan), correo del usuario y botón de cerrar sesión del login. Menú desplegable en móvil.
- InsigniaUrgencia (verde/amarillo/rojo/vencido con ETIQUETA_URGENCIA y los tonos de la sección 13).
- InsigniaEstadoPago (pendiente/pagado).

TAREA 4. app/hogar/layout.tsx (servidor): obtenerSesion(); sin sesión, redirect al login. Renderiza NavegacionHogar y el contenido (ancho máximo 1100 px, fondo --color-fondo).

TAREA 5. app/page.tsx: si es la plantilla de Next.js, redirección a /hogar; si tiene contenido propio, agrega un enlace a /hogar sin borrarlo.

TAREA 6. Catálogos: components/hogar/FormularioMiembro.tsx, FormularioCategoria.tsx y app/hogar/catalogos/page.tsx (servidor):
- Sección Miembros: formulario (nombre) y tabla con nombre, estado, movimientos, acción activar/desactivar (PATCH /api/hogar/miembros/[id]).
- Sección Categorías: formulario (nombre, límite mensual opcional) y tabla con nombre, límite (formatearPesos o "Sin límite"), estado, movimientos, acción activar/desactivar.
- Las acciones llaman a la API, muestran error.mensaje si fallan y ejecutan router.refresh() si tienen éxito.
- Nombre duplicado muestra el mensaje de NOMBRE_DUPLICADO.

VERIFICACIÓN: pídeme que inicie sesión si lo necesitas. Comprueba: el login lleva al panel (aunque el panel aún sea básico); crear un miembro y una categoría con límite; intentar un nombre repetido (error); desactivar y activar. Revisa la navegación en móvil.

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P06 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** crear un miembro y una categoría; comprobar que un nombre repetido se rechaza.

**Commit sugerido:** `feat(interfaz): componentes base, navegación y catálogos`

---

## P07 · Pagos y panel de alertas

**Fase:** 5 · **Crea:** registro y listado de pagos, panel con alertas de vencimiento

````text
Antes de escribir código lee completos: doc/PLAN_CASA_MATUTE.md (secciones 5.2, 6, 7 con CU2 y CU5, 11.3, 12 y 14), doc/ESTADO_EJECUCION.md y los componentes existentes.

OBJETIVO: registrar obligaciones de pago y mostrar el panel con las alertas de vencimiento (resuelve CU2 y CU5, parte del módulo mínimo F4).

TAREA 1. components/hogar/FormularioPago.tsx (cliente) y app/hogar/pagos/nuevo/page.tsx: nombre, monto, fecha límite (atributo min = mañana en Bogotá), casillas recurrente y abonable. Validación en el navegador con esquemaPago; la fecha debe ser futura (si no, el mensaje de FECHA_NO_FUTURA). POST /api/hogar/pagos; al guardar, navega a /hogar/pagos.

TAREA 2. components/hogar/TablaPagos.tsx y app/hogar/pagos/page.tsx (servidor): listarPagos; columnas nombre, monto, abonado, restante, fecha límite, InsigniaUrgencia (calculada con diasRestantes y nivelUrgencia solo para pendientes; los pagados no muestran urgencia), InsigniaEstadoPago, abonable (Sí/No). Acción "Eliminar" solo en pagos pendientes sin movimientos (DELETE /api/hogar/pagos/[id], con confirmación; si responde PAGO_NO_ELIMINABLE, muestra el mensaje). Botón "Registrar pago". EstadoVacio si no hay pagos.

TAREA 3. components/hogar/TablaAlertas.tsx y app/hogar/page.tsx (servidor), el panel que resuelve CU2:
- obtenerPanel(): muestra TablaAlertas con los pagos pendientes ordenados vencidos y rojos primero (cada fila: nombre, restante, fecha límite, días restantes con formatearDiasRestantes, InsigniaUrgencia).
- TarjetaSaldo simple con el saldo del mes (del desglose que ya calcula el panel).
- Accesos rápidos "Registrar movimiento" y "Registrar pago".
- EstadoVacio "No hay pagos pendientes" si la lista está vacía.
- (El aviso de gastos hormiga se agrega en P10.)

VERIFICACIÓN: pídeme que inicie sesión si lo necesitas. Con los datos DEMO: registrar un pago con fecha límite dentro de 5 días (aparece amarillo) y uno dentro de 1 día (rojo); intentar una fecha pasada (rechazo); ver el panel con las alertas ordenadas (vencidos y rojos primero); eliminar un pago pendiente sin movimientos; intentar eliminar uno con movimientos (rechazo). Documenta.

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P07 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** registrar pagos con distintas fechas límite y confirmar que el panel los ordena por urgencia (vencidos y rojos primero).

**Commit sugerido:** `feat(interfaz): registro de pagos y panel de alertas de vencimiento`

---

## P08 · Movimientos y aceptación del módulo mínimo

**Fase:** 5 y 6 · **Crea:** registro y listado de movimientos, `doc/ACEPTACION.md` · **Modifica:** `README.md`

````text
Antes de escribir código lee completos: doc/PLAN_CASA_MATUTE.md (secciones 4, 6, 7.1 con CU1 y CU4, 11.3, 12, 14, 15, 16 y 17), doc/ESTADO_EJECUCION.md y los componentes existentes.

OBJETIVO: registrar movimientos con la vinculación a pagos y la verificación de saldo, listarlos, y cerrar el módulo mínimo con la aceptación.

TAREA 1. components/hogar/SelectorPago.tsx (cliente): lista los pagos en estado pendiente (GET /api/hogar/pagos?estado=pendiente); al elegir uno, informa a FormularioMovimiento si es abonable y su restante.

TAREA 2. components/hogar/FormularioMovimiento.tsx (cliente) y app/hogar/movimientos/nuevo/page.tsx:
- Campos: tipo (ingreso/gasto); miembro (Selector de activos); categoría (Selector de activos); monto; fecha (por defecto hoyBogota()).
- Si el tipo es gasto: casilla "gasto hormiga" y SelectorPago opcional.
  · Si el pago elegido NO es abonable: el monto se autocompleta con el restante y se bloquea; muestra el texto de la sección 12.1 (autocompletado de pago no abonable).
  · Si es abonable: el monto queda editable y se muestra el restante como referencia.
- Si el tipo es ingreso: oculta hormiga y pago (coherente con RN-03).
- Antes de confirmar un gasto, muestra el saldo del mes y el resultante estimado (saldo - monto), con la advertencia de la sección 12.1 si quedaría negativo; no bloquees el envío por esto (la decisión final la toma el servidor), pero avisa.
- Validación en el navegador con esquemaMovimiento. POST /api/hogar/movimientos.
- Respuesta: Aviso con el saldo nuevo; si estadoPago llegó a 'pagado', indícalo. Si el servidor responde SALDO_INSUFICIENTE, muestra el mensaje con el saldo disponible de detalles. Navega a /hogar/movimientos tras el éxito.

TAREA 3. components/hogar/FiltrosMovimientos.tsx, TablaMovimientos.tsx y app/hogar/movimientos/page.tsx (servidor): filtros por miembro, categoría y rango de fechas (searchParams como Promise); columnas fecha, miembro, categoría, tipo (Insignia ingreso/gasto), monto, marca de hormiga, pago vinculado (nombre o "—"); orden por fecha descendente; EstadoVacio; botón "Registrar movimiento".

TAREA 4. Revisa el código contra las secciones 4, 10.3 y 15. Reporta y corrige en la bitácora: cálculo de saldo que no siga la sección 4; comparaciones de porcentaje con decimales; rutas sin exigirSesion; movimientos editables o eliminables; uso de new Date() para "hoy" fuera de fechas.ts; SQL concatenado; textos en inglés; urgencia comunicada solo con color.

TAREA 5. Ejecuta npm test y npm run probar:flujo; corrige fallas en el código. Prepara la aceptación: db:limpiar --prueba; conserva los Demo.

TAREA 6. Crea doc/ACEPTACION.md con la tabla A-01 a A-18 de la sección 16.3 (columnas: ID, acción, resultado esperado, resultado obtenido, evidencia, observación; las tres últimas vacías) y una nota de que A-13 a A-17 corresponden a las funcionalidades opcionales (P09 y P10).

TAREA 7. Actualiza README.md: descripción; funcionalidades; requisitos; cómo correr en local (npm install, .env.local con los NOMBRES de las variables, db:migrar, db:demo, dev); scripts y su propósito; estructura de carpetas; la definición de saldo de la sección 4; tabla de las reglas del plan funcional con la función o restricción que las aplica; nota de seguridad; enlace a doc/PLAN_CASA_MATUTE.md.

TAREA 8. Verifica que .env.local esté en .gitignore y que ningún archivo versionado tenga valores de variables de entorno.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_5_COMPLETADA.md (interfaz) y doc/checkpoints/FASE_6_COMPLETADA.md (revisión y pruebas).
- Marca P08 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen y recuérdame que A-01 a A-12 y A-18 se ejecutan en el despliegue de Vercel.
````

**Verificación del estudiante:** registrar un ingreso y luego un gasto vinculado a un pago no abonable (el monto se autocompleta y el pago queda saldado); intentar un gasto mayor al saldo y ver el rechazo. Hacer push y ejecutar A-01 a A-12 y A-18 en Vercel.

**Commit sugerido:** `feat(interfaz): registro de movimientos y aceptación del módulo mínimo`

---

## P09 · Opcionales: saldo y alertas de categoría

**Fase:** 7 · **Requisito:** `doc/checkpoints/FASE_6_COMPLETADA.md` existe y `doc/ACEPTACION.md` está diligenciado

````text
Antes de escribir código lee completos: doc/PLAN_CASA_MATUTE.md (secciones 4, 5.3, 9, 16.1 (T-26 a T-31), 16.3 (A-14 a A-16) y 18), doc/ESTADO_EJECUCION.md y doc/checkpoints/FASE_6_COMPLETADA.md. Si FASE_6_COMPLETADA.md no existe, detente y avísame.

OBJETIVO: presentar el saldo del hogar (F3) y las alertas de límite de categoría (F5).

TAREA 1. F3 · Saldo:
- app/api/hogar/saldo/route.ts: GET con exigirSesion(); calcularSaldo() (ya existe en lib/datos/saldo.ts).
- components/hogar/TarjetaSaldo.tsx y app/hogar/saldo/page.tsx: desglose de la sección 4 (ingresos del mes, gastos del mes, pagos pendientes del mes, saldo resultante), con los montos formateados y el saldo en verde si es positivo o en rojo si es 0 o menos.
- Agrega el enlace "Saldo" a NavegacionHogar.

TAREA 2. F5 · Alertas de categoría:
- Verifica que lib/reglas/categoria.ts y las pruebas T-26 a T-31 pasan (se crearon en P02).
- lib/datos/resumen.ts (o catalogos.ts): obtenerEstadoCategorias() devuelve, para cada categoría activa con límite, el acumulado de gastos del mes (inicioYFinDeMes), el límite, el nivel (nivelCategoria) y el porcentaje para mostrar. Reexporta en dataService.
- components/hogar/InsigniaCategoria.tsx (normal/amarillo/rojo).
- En app/hogar/catalogos/page.tsx, en la tabla de categorías, agrega una columna "Gasto del mes" con el acumulado y la InsigniaCategoria.
- En app/hogar/page.tsx (panel), agrega un bloque "Categorías cerca del límite" que liste solo las categorías en amarillo o rojo (si hay).

VERIFICACIÓN: pídeme que inicie sesión si lo necesitas. Con una categoría de límite conocido, registra gastos hasta el 90 % (debe marcarse amarilla) y supera el 100 % (roja); abre /hogar/saldo y verifica el desglose contra un cálculo a mano. Documenta.

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P09 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** registrar gastos en una categoría hasta pasar el 90 % y el 100 %, y ver cómo cambia la insignia; revisar el desglose de saldo.

**Commit sugerido:** `feat(opcional): saldo del hogar y alertas de límite de categoría`

---

## P10 · Opcionales: resumen y gastos hormiga

**Fase:** 7 (cierre) · **Requisito:** P09 completado

````text
Antes de escribir código lee completos: doc/PLAN_CASA_MATUTE.md (secciones 6, 7 con CU3, 9, 16.1 (T-32, T-33), 16.3 (A-13, A-17) y 18), doc/ESTADO_EJECUCION.md y los componentes existentes.

OBJETIVO: el resumen por miembro y categoría (F6) y los gastos hormiga con su umbral (F7).

TAREA 1. F6 · Resumen:
- lib/datos/resumen.ts: obtenerResumen({ desde, hasta, miembroId?, categoriaId? }) agrupa los movimientos del rango por miembro y por categoría y devuelve totales (ingresos y gastos por grupo, y total general). Reexporta en dataService.
- app/api/hogar/resumen/route.ts: GET con exigirSesion() y esquemaFiltrosResumen (desde y hasta requeridos).
- components/hogar/TablaResumen.tsx y app/hogar/resumen/page.tsx: selector de rango (por defecto el mes en curso) y filtros opcionales de miembro y categoría; dos tablas (por miembro y por categoría) con sus totales. Enlace "Resumen" en NavegacionHogar.

TAREA 2. F7 · Gastos hormiga:
- Verifica que lib/reglas/hormiga.ts y las pruebas T-32, T-33 pasan.
- lib/datos/movimientos.ts o resumen.ts: obtenerAcumuladoHormiga() suma los gastos del mes con es_hormiga true (inicioYFinDeMes) y devuelve { acumulado, supera }. Reexporta en dataService e inclúyelo en obtenerPanel().
- components/hogar/AvisoHormiga.tsx: si supera es true, Aviso de advertencia "Gastos hormiga del mes: {acumulado}. Alcanzaste el umbral de {umbral}."; si no, una línea informativa con el acumulado.
- En app/hogar/page.tsx (panel), muestra el AvisoHormiga.
- En FormularioMovimiento, al marcar la casilla "gasto hormiga", muestra el acumulado hormiga del mes como referencia (consulta el panel o un endpoint ligero).

VERIFICACIÓN: pídeme que inicie sesión si lo necesitas. Registra dos gastos marcados como hormiga que juntos lleguen o pasen el umbral y comprueba el aviso en el panel; abre /hogar/resumen en el mes y verifica los totales por miembro y categoría contra un cálculo a mano. Confirma que un gasto hormiga también cuenta en el límite de su categoría (RN-17). Documenta.

AL TERMINAR:
- npm run build y npm test sin errores.
- Agrega a doc/ACEPTACION.md los resultados de A-13, A-14, A-15, A-16 y A-17.
- Crea doc/checkpoints/FASE_7_COMPLETADA.md.
- Marca P10 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** registrar gastos hormiga hasta el umbral y ver el aviso; revisar el resumen del mes por miembro y categoría.

**Commit sugerido:** `feat(opcional): resumen por miembro y categoría y gastos hormiga`

---

## Prompts auxiliares

### Corrección de un error

Reemplazar `[NN]` por el número del prompt y pegar el error completo donde se indica.

````text
Durante la ejecución del prompt P[NN] apareció este error:

[PEGAR AQUÍ EL ERROR COMPLETO]

Lee doc/PLAN_CASA_MATUTE.md, doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Encuentra la causa y corrígela sin salir del alcance de P[NN]. No modifiques pruebas ni scripts de prueba para que pasen; corrige el código que prueban. Ejecuta npm run build y npm test. Registra en la bitácora la causa, la corrección y los archivos modificados. Muéstrame un resumen.
````

### Reanudación de un prompt interrumpido

````text
La ejecución anterior del prompt P[NN] se interrumpió. Lee doc/ESTADO_EJECUCION.md, doc/PLAN_CASA_MATUTE.md y doc/PROMPTS_CASA_MATUTE.md (sección P[NN]). Revisa qué archivos de P[NN] ya existen y cuáles faltan, y continúa desde la primera tarea incompleta sin rehacer lo terminado. Al final ejecuta npm run build y npm test, y actualiza la bitácora.
````

### Despliegue fallido en Vercel

````text
El despliegue en Vercel falló con este registro:

[PEGAR AQUÍ EL REGISTRO DEL BUILD DE VERCEL]

Lee doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Identifica la causa (error de compilación, variable de entorno faltante en Vercel, diferencia entre local y producción). Si es de código, corrígelo y verifica con npm run build. Si es una variable de entorno, dime exactamente qué NOMBRE de variable falta y en qué entornos de Vercel agregarla, sin pedir ni mostrar valores. Registra la causa y la solución en la bitácora.
````

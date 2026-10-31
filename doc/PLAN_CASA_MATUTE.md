# Casa Matute · Plan técnico de implementación

> Gestor de Presupuesto del Hogar · versión técnica 1.0, derivada del plan funcional del estudiante
> Asignatura: Lógica y Programación (SIST0200) · Universidad Sergio Arboleda, Santa Marta · Docente: Jhonatan Castro Polo
> Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Supabase Postgres + Zod · Despliegue en Vercel
> Ejecución: GitHub Copilot en modo Agente, con los prompts de `doc/PROMPTS_CASA_MATUTE.md`

---

## Índice

0. [Cómo se usa este documento](#0-cómo-se-usa-este-documento)
1. [Punto de partida](#1-punto-de-partida)
2. [Advertencia de seguridad previa](#2-advertencia-de-seguridad-previa)
3. [Alcance](#3-alcance)
4. [Definición de saldo del hogar](#4-definición-de-saldo-del-hogar)
5. [Estados y clasificaciones](#5-estados-y-clasificaciones)
6. [Reglas de negocio](#6-reglas-de-negocio)
7. [Casos de uso](#7-casos-de-uso)
8. [Modelo de datos](#8-modelo-de-datos)
9. [Cálculos](#9-cálculos)
10. [Arquitectura del código](#10-arquitectura-del-código)
11. [Contratos de API](#11-contratos-de-api)
12. [Pantallas](#12-pantallas)
13. [Identidad visual](#13-identidad-visual)
14. [Dinero, fechas y zona horaria](#14-dinero-fechas-y-zona-horaria)
15. [Seguridad e integridad](#15-seguridad-e-integridad)
16. [Pruebas](#16-pruebas)
17. [Plan de ejecución](#17-plan-de-ejecución)
18. [Funcionalidades opcionales](#18-funcionalidades-opcionales)
19. [Glosario](#19-glosario)

---

## 0. Cómo se usa este documento

Este plan es el documento rector del proyecto. Copilot lo lee antes de cada tarea y los prompts remiten a sus secciones por número. Si un prompt y este plan no coinciden, prevalece el plan.

| Archivo en el repositorio | Función |
|---|---|
| `doc/PLAN_CASA_MATUTE.md` | Este documento |
| `doc/PROMPTS_CASA_MATUTE.md` | Prompts en orden de ejecución |
| `doc/ESTADO_ACTUAL.md` | Radiografía del repositorio antes de empezar (lo crea P00) |
| `doc/ESTADO_EJECUCION.md` | Avance prompt por prompt |
| `doc/checkpoints/FASE_N_COMPLETADA.md` | Evidencia del cierre de cada fase |
| `.github/copilot-instructions.md` | Reglas permanentes que Copilot aplica en todas las conversaciones |

---

## 1. Punto de partida

### 1.1 Lo que ya existe y no se reconstruye

- Proyecto Next.js con TypeScript desplegado en Vercel.
- Proyecto Supabase conectado al despliegue.
- Login funcionando.
- Variables de entorno en `.env.local` (local) y en el proyecto de Vercel (producción).

### 1.2 Lo que se verifica en P00 antes de escribir código

| Aspecto | Por qué importa |
|---|---|
| Mecanismo del login (JWT propio en cookie, Supabase Auth u otro) | El adaptador `lib/auth/sesion.ts` debe envolverlo sin reescribirlo |
| Ruta a la que redirige el login | Se cambia a `/hogar` |
| Archivo de middleware existente | En Next.js 16 se llama `proxy.ts`; en versiones anteriores, `middleware.ts` |
| Variable de conexión directa a Postgres | El registro de movimientos usa transacciones con `pg`; si no existe, se obtiene en P00 |
| Mecanismo de migraciones existente | Las tablas nuevas se aplican con ese mecanismo; si no existe, se crea `npm run db:migrar` |
| Versión de Tailwind | Define dónde se declaran los colores (sección 13) |
| Rutas `/hogar` o `/api/hogar` | No deben existir antes; si existen, se reporta el conflicto |
| Tablas previas llamadas `miembros`, `categorias`, `movimientos` o `pagos` | Si existen, se reporta su estructura antes de crear las nuevas |

### 1.3 Regla sobre el login

El login existente no se reescribe. Solo se agrega:

1. Un adaptador `lib/auth/sesion.ts` que expone `obtenerSesion()` y `exigirSesion()` usando el mecanismo que ya existe.
2. Protección de las rutas `/hogar/*` y `/api/hogar/*`.
3. La redirección posterior al login hacia `/hogar`.

El plan funcional (RNF4) exige que solo miembros registrados accedan. En este sistema no hay roles diferenciados: toda persona con sesión válida es un miembro y puede ver y registrar todo (sección 7 del plan funcional, "no hay roles de permisos distintos"). Los "miembros del hogar" de los datos son las personas a las que se atribuyen los movimientos, no cuentas de login separadas.

---

## 2. Advertencia de seguridad previa

El plan funcional entregado incluía un correo y una contraseña reales de acceso al sistema. Antes de ejecutar estos prompts:

1. **Cambiar la contraseña** de la cuenta expuesta en el sistema de login.
2. **Confirmar que `.env.local` está en `.gitignore`** y que ningún archivo del repositorio ni de la entrega contiene valores de variables de entorno ni credenciales.
3. **No volver a pegar credenciales en un documento.** Cuando haga falta mostrar la configuración, se escriben solo los NOMBRES de las variables.

Este paso es obligatorio y previo a todo lo demás.

---

## 3. Alcance

### 3.1 Módulo mínimo

| ID | Funcionalidad (plan funcional) | Requisitos | Casos de uso | Prompts |
|---|---|---|---|---|
| F1 | Registrar movimiento (ingreso o gasto), opcionalmente vinculado a un pago | RF1, RF8, RF9 | CU1, CU3 | P04, P05, P08 |
| F2 | Registrar obligación de pago | RF2 | — | P04, P05, P07 |
| F4 | Alertar vencimientos con niveles de urgencia | RF4 | CU2 | P02, P04, P07 |

El plan funcional define el módulo mínimo como F1, F2 y F4. Para que F1 cumpla la regla de saldo (RF8), el módulo mínimo necesita calcular el saldo, así que el cálculo de saldo (F3), que el plan marca como opcional, se incluye en el mínimo como soporte de RF8. Su presentación como pantalla propia queda en lo opcional.

### 3.2 Funcionalidades opcionales

| ID | Funcionalidad | Requisitos | Casos de uso | Prompts |
|---|---|---|---|---|
| F3 | Presentar el saldo disponible del hogar | RF3 | — | P09 |
| F5 | Alertar límite de categoría (90 % y 100 %) | RF5 | — | P09 |
| F6 | Resumen por miembro y categoría en un rango | RF6 | — | P10 |
| F7 | Gastos hormiga y su umbral mensual | RF7 | CU3 | P10 |

Se construyen solo con la fase 6 cerrada. El cálculo de saldo ya existe desde el módulo mínimo (soporta RF8); F3 agrega su presentación.

### 3.3 Fuera de alcance

Se mantiene la lista del plan funcional: integración bancaria o importación de extractos, reportes en PDF o Excel, varias monedas o conversión de divisas, y roles de permisos distintos entre miembros.

### 3.4 Ajustes respecto al plan funcional

| Plan funcional | Plan técnico | Motivo |
|---|---|---|
| Montos decimales | Montos en pesos enteros (`INTEGER`) | El peso colombiano no usa centavos; los decimales causan errores de redondeo en saldos y acumulados (sección 14) |
| "Saldo disponible del hogar" descrito en prosa | Definición única y precisa en la sección 4 | El plan lo describe de dos formas distintas (sección 3 función 3 y sección 4 proceso); se fija una sola para que RF8 sea determinista |
| Miembro y categoría sin más atributos | Se agrega `activo` para poder retirarlos sin borrar su historial | Un miembro o categoría con movimientos no debe eliminarse |
| Umbrales dispersos en el texto | Todos en `lib/config/presupuesto.ts` | RNF5: ajustables sin tocar la lógica |
| Pago "recurrente" como booleano sin efecto descrito | El booleano se guarda; la generación automática del siguiente pago queda fuera de esta versión (se documenta) | El plan no define cuándo ni cómo se regenera un pago recurrente; se registra el dato sin inventar comportamiento |

### 3.5 Decisiones de alcance de esta versión técnica

| Decisión | Motivo |
|---|---|
| Los movimientos no se editan ni se eliminan en esta versión | Editar un movimiento vinculado a un pago abonable obligaría a revertir estados y recalcular saldos; se registra un movimiento de corrección en su lugar (fuera de alcance aquí) |
| Un pago pendiente se puede eliminar solo si está en estado `pendiente` y no tiene movimientos vinculados | Permite corregir un registro equivocado sin alterar el historial |
| El campo `recurrente` se guarda pero no genera pagos nuevos automáticamente | El plan no define la regla de recurrencia |
| El saldo se calcula sobre el mes en curso en zona `America/Bogota` | Coherente con "del mes" en el plan funcional (sección 4) |
| Un pago ya `pagado` no se puede volver a vincular a un movimiento | Evita abonos sobre algo saldado |

---

## 4. Definición de saldo del hogar

El plan funcional describe el saldo de dos maneras: "ingresos menos compromisos fijos" (sección 3) y "suma ingresos del mes, resta gastos y obligaciones pendientes del mes" (sección 4). Para que la regla de rechazo (RF8) sea determinista, se fija esta definición única, usada en todo el sistema:

```
saldo_disponible =
    (suma de ingresos del mes en curso)
  - (suma de gastos del mes en curso)
  - (monto restante de los pagos pendientes con fecha límite dentro del mes en curso que siguen en estado "pendiente")
```

Precisiones:

- **Mes en curso:** desde el día 1 hasta el último día del mes actual en zona `America/Bogota`.
- **Ingresos y gastos del mes:** movimientos cuyo campo `fecha` cae dentro del mes en curso.
- **Monto restante de un pago:** su monto total menos la suma de los movimientos ya vinculados a él. Un pago abonable con abonos previos solo descuenta lo que le falta, no su total.
- **Solo se restan los pagos del mes en curso:** un pago con fecha límite el mes próximo no reduce el saldo de este mes. Esto evita contar dos veces un pago cuyo abono ya se registró como gasto.
- **Doble conteo:** un gasto vinculado a un pago ya cuenta como gasto del mes. Para no restarlo también como "pago pendiente", el monto restante del pago se calcula descontando sus movimientos vinculados; cuando el pago queda saldado, su restante es 0 y deja de pesar.

### 4.1 Verificación de RF8 (rechazo por saldo negativo)

Al registrar un gasto, el sistema calcula cuál sería el saldo **después** de guardarlo y, si resulta negativo, rechaza el registro (RN-08). El cálculo se hace dentro de la misma transacción que insertaría el movimiento, con las filas relevantes bloqueadas, y se revierte si el saldo no lo permite.

Caso de HU2: saldo $50.000, gasto de $50.000 → saldo quedaría en $0, se acepta. Gasto de $80.000 → saldo quedaría en -$30.000, se rechaza.

---

## 5. Estados y clasificaciones

### 5.1 Estado de un pago pendiente

| Código | Etiqueta | Significado |
|---|---|---|
| `pendiente` | Pendiente | No se ha saldado |
| `pagado` | Pagado | La suma de sus movimientos vinculados alcanzó o superó su monto total |

Transiciones (sección 12 del plan funcional):

```text
pendiente ──(pago no abonable: un movimiento por el monto restante)──► pagado
pendiente ──(pago abonable: suma de abonos < monto total)──► pendiente
pendiente ──(pago abonable: suma de abonos ≥ monto total)──► pagado
```

Un pago no vuelve de `pagado` a `pendiente` en esta versión.

### 5.2 Nivel de urgencia de un pago (clasificación informativa)

Depende de los días restantes hasta la fecha límite y es independiente del estado (sección 12 del plan funcional: un pago `pagado` no se clasifica; solo los `pendiente` entran en las alertas).

| Nivel | Condición (días restantes = fecha límite − hoy, en Bogotá) |
|---|---|
| `verde` | 8 días o más |
| `amarillo` | entre 3 y 7 días, inclusive |
| `rojo` | 2 días o menos, incluido el día del vencimiento (0, 1, 2) |
| `vencido` | fecha límite ya pasada (días restantes negativos) y estado `pendiente` |

Casos límite (regla del plan): exactamente 7 días es `amarillo`; exactamente 2 días es `rojo`; el día del vencimiento (0 días) es `rojo`.

### 5.3 Clasificación de una categoría

Según el gasto acumulado del mes frente al límite mensual de la categoría:

| Nivel | Condición |
|---|---|
| `normal` | acumulado menor al 90 % del límite |
| `amarillo` | acumulado desde el 90 % (inclusive) y menor al 100 % |
| `rojo` | acumulado igual o mayor al 100 % |

Caso límite: exactamente el 90 % es `amarillo`. Una categoría sin límite (límite nulo o 0) no se clasifica.

---

## 6. Reglas de negocio

| ID | Regla | Origen | Dónde se aplica |
|---|---|---|---|
| RN-01 | El monto de un movimiento es un entero mayor que 0 | Sección 13, validación | `lib/reglas/movimiento.ts`; Zod; BD CHECK |
| RN-02 | El tipo de movimiento es `ingreso` o `gasto` | Sección 5 | BD CHECK; Zod |
| RN-03 | `es_hormiga` y `pago_pendiente_id` solo aplican a movimientos de tipo `gasto` | Sección 5 | Dominio; BD CHECK |
| RN-04 | La categoría de un movimiento debe existir y estar activa | Sección 13, validación | Servicio; BD foreign key |
| RN-05 | El miembro de un movimiento debe existir y estar activo | Agregada | Servicio; BD foreign key |
| RN-06 | La fecha límite de un pago debe ser futura al registrarlo | Sección 13, validación | `lib/reglas/fechas.ts`; Zod |
| RN-07 | El monto de un pago pendiente es un entero mayor que 0 | Agregada | Zod; BD CHECK |
| RN-08 | Un gasto se rechaza si dejaría el saldo del hogar en negativo | RF8, HU2 | Servicio `registrarMovimiento` dentro de la transacción (sección 4.1) |
| RN-09 | Nivel de urgencia de un pago según los días restantes (verde, amarillo, rojo, vencido) | Sección 6, HU1 | `lib/reglas/urgencia.ts` |
| RN-10 | Vinculación a pago NO abonable: el monto del movimiento se autocompleta con el restante del pago y no se edita; al guardar, el pago pasa a `pagado` | Sección 6, CU1 | Servicio; dominio |
| RN-11 | Vinculación a pago abonable: el monto lo elige el usuario; cuando la suma de abonos alcanza o supera el total, el pago pasa a `pagado` (igualar el total basta) | Sección 6, HU3 | Servicio `recalcularEstadoPago` |
| RN-12 | Un movimiento sin pago vinculado no afecta el estado de ningún pago | Sección 6 | Servicio |
| RN-13 | No se puede vincular un movimiento a un pago ya `pagado` | Agregada | Servicio |
| RN-14 | El monto de un abono no puede exceder el restante de un pago no abonable (es exactamente el restante); en un abonable puede ser cualquier monto positivo | Sección 6 | Dominio `validarVinculacion` |
| RN-15 | Clasificación de categoría: amarillo desde el 90 %, rojo desde el 100 % del límite mensual | Sección 6, RF5 | `lib/reglas/categoria.ts` |
| RN-16 | Umbral de gastos hormiga: la suma de los movimientos del mes con `es_hormiga = true`, de cualquier categoría; si alcanza o supera el umbral, se avisa | Sección 6, RF7 | `lib/reglas/hormiga.ts` |
| RN-17 | Un gasto hormiga también cuenta para el límite de su categoría; las dos reglas son independientes | Sección 6 | Cálculos separados |
| RN-18 | Los umbrales (días de urgencia, 90 % de categoría, umbral hormiga) se leen de configuración, no del código disperso | RNF5 | `lib/config/presupuesto.ts` |
| RN-19 | El estado del pago (pendiente/pagado) es independiente del nivel de urgencia | Sección 12 | Modelo y presentación separados |
| RN-20 | Los movimientos son inmutables; un pago se elimina solo si está `pendiente` y sin movimientos | Sección 3.5 | Servicio; BD `ON DELETE RESTRICT` |

---

## 7. Casos de uso

| ID | Actor | Entrada | Precondición | Efecto | Errores posibles |
|---|---|---|---|---|---|
| CU1 Registrar gasto vinculado a pago | Miembro | miembro, categoría, monto, fecha, pago, `es_hormiga` | existe un pago `pendiente` | Gasto creado; saldo verificado; estado del pago recalculado | `DATOS_INVALIDOS`, `SALDO_INSUFICIENTE`, `PAGO_YA_PAGADO`, `MONTO_NO_EDITABLE`, `CATEGORIA_INVALIDA`, `MIEMBRO_INVALIDO` |
| CU2 Consultar alertas de vencimiento | Miembro | fecha actual | hay pagos registrados | Lista de pagos `pendiente` con su nivel, ordenada: vencidos y rojos primero | — |
| CU3 Registrar gasto hormiga | Miembro | gasto con `es_hormiga = true` | registrando un gasto | Gasto creado; acumulado hormiga recalculado; aviso si alcanza el umbral | los de CU1 |
| CU4 Registrar ingreso | Miembro | miembro, categoría, monto, fecha | — | Ingreso creado; saldo actualizado | `DATOS_INVALIDOS`, `CATEGORIA_INVALIDA`, `MIEMBRO_INVALIDO` |
| CU5 Registrar obligación de pago | Miembro | nombre, monto, fecha límite, recurrente, abonable | fecha futura | Pago `pendiente` creado | `DATOS_INVALIDOS`, `FECHA_NO_FUTURA` |
| CU6 Gestionar miembros y categorías | Miembro | nombre; categoría con límite; activar o desactivar | nombre no repetido | Alta, cambio o desactivación | `DATOS_INVALIDOS`, `NOMBRE_DUPLICADO`, `TIENE_MOVIMIENTOS` |
| CU7 Eliminar pago | Miembro | pago | `pendiente` sin movimientos | Pago eliminado | `PAGO_NO_ELIMINABLE` |
| CU8 Consultar saldo (opcional) | Miembro | — | — | Saldo del mes con su desglose | — |
| CU9 Resumen por miembro y categoría (opcional) | Miembro | rango de fechas; filtro de miembro o categoría | — | Totales agregados | `DATOS_INVALIDOS` |

### 7.1 Secuencia de CU1 / CU4 (registrar movimiento)

Todo ocurre dentro de `conTransaccion`:

1. `validarMovimiento` sobre los datos de entrada (monto entero mayor que 0, tipo válido, coherencia de `es_hormiga` y `pago` con el tipo).
2. Verificar que el miembro y la categoría existen y están activos (`MIEMBRO_INVALIDO`, `CATEGORIA_INVALIDA`).
3. Si hay `pago_pendiente_id`: bloquear el pago `FOR UPDATE`; si no existe, `PAGO_NO_ENCONTRADO`; si está `pagado`, `PAGO_YA_PAGADO` (RN-13); calcular su restante; aplicar `validarVinculacion` (RN-10, RN-14): si no es abonable, el monto del movimiento debe ser exactamente el restante; si es abonable, el monto es el que envió el usuario.
4. Si es un gasto: calcular el saldo que quedaría tras el movimiento (sección 4) con los ingresos, gastos y pagos del mes bloqueados en lo necesario; si sería negativo, lanzar `SALDO_INSUFICIENTE` y revertir (RN-08).
5. Insertar el movimiento.
6. Si hay pago vinculado: `recalcularEstadoPago` suma los movimientos del pago; si alcanza o supera el total, lo marca `pagado` (RN-11).
7. Insertar el evento correspondiente.
8. Confirmar y devolver el movimiento, el saldo nuevo y el estado del pago.

```ts
export async function registrarMovimiento(d: DatosMovimiento, miembroSesion: string): Promise<ResultadoMovimiento> {
  validarMovimiento(d);
  return conTransaccion(async (tx) => {
    await verificarMiembroActivo(tx, d.miembroId);
    await verificarCategoriaActiva(tx, d.categoriaId);

    let pago = null;
    let montoFinal = d.monto;
    if (d.tipo === 'gasto' && d.pagoPendienteId) {
      pago = await bloquearPago(tx, d.pagoPendienteId);
      if (pago.estado === 'pagado') throw new ErrorDeNegocio('PAGO_YA_PAGADO');
      const restante = pago.monto - (await sumarAbonos(tx, pago.id));
      montoFinal = resolverMontoVinculado({ abonable: pago.abonable, montoEnviado: d.monto, restante }); // RN-10, RN-14
    }

    if (d.tipo === 'gasto') {
      const saldoTras = await calcularSaldoTrasGasto(tx, montoFinal); // sección 4
      if (saldoTras < 0) throw new ErrorDeNegocio('SALDO_INSUFICIENTE', undefined, { saldoDisponible: saldoTras + montoFinal });
    }

    const mov = await insertarMovimiento(tx, { ...d, monto: montoFinal });
    let estadoPago = pago?.estado ?? null;
    if (pago) estadoPago = await recalcularEstadoPago(tx, pago.id); // RN-11
    await registrarEvento(tx, { tipo: 'MOVIMIENTO_REGISTRADO', detalle: { movimientoId: mov.id, tipo: d.tipo, monto: montoFinal } });

    const saldo = await calcularSaldo(tx);
    return { movimiento: mov, saldo, estadoPago };
  });
}
```

---

## 8. Modelo de datos

### 8.1 Relaciones

```text
miembros 1 ──── N movimientos
categorias 1 ── N movimientos
pagos 1 ─────── N movimientos   (un pago puede recibir varios abonos)
```

Las migraciones se guardan en `supabase/migrations/` y continúan la numeración existente (P00 la identifica). En este documento se nombran M1 y M2.

### 8.2 M1 · Tablas

```sql
-- M1: tablas del Gestor de Presupuesto del Hogar (Casa Matute)

CREATE TABLE IF NOT EXISTS miembros (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      VARCHAR(80)   NOT NULL,
  activo      BOOLEAN       NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT miembros_nombre_minimo CHECK (char_length(btrim(nombre)) >= 2)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_miembros_nombre ON miembros (lower(btrim(nombre)));

CREATE TABLE IF NOT EXISTS categorias (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          VARCHAR(80)   NOT NULL,
  limite_mensual  INTEGER,                              -- nulo: categoría sin límite
  activo          BOOLEAN       NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT categorias_nombre_minimo  CHECK (char_length(btrim(nombre)) >= 2),
  CONSTRAINT categorias_limite_valido  CHECK (limite_mensual IS NULL OR limite_mensual > 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_categorias_nombre ON categorias (lower(btrim(nombre)));

CREATE TABLE IF NOT EXISTS pagos (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        VARCHAR(120)  NOT NULL,
  monto         INTEGER       NOT NULL,
  fecha_limite  DATE          NOT NULL,
  recurrente    BOOLEAN       NOT NULL DEFAULT false,
  abonable      BOOLEAN       NOT NULL DEFAULT false,
  estado        VARCHAR(10)   NOT NULL DEFAULT 'pendiente',
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT pagos_nombre_minimo  CHECK (char_length(btrim(nombre)) >= 2),
  CONSTRAINT pagos_monto_positivo CHECK (monto > 0),                       -- RN-07
  CONSTRAINT pagos_estado_valido  CHECK (estado IN ('pendiente', 'pagado'))
);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON pagos (estado, fecha_limite);

CREATE TABLE IF NOT EXISTS movimientos (
  id                 BIGSERIAL     PRIMARY KEY,
  miembro_id         UUID          NOT NULL REFERENCES miembros(id) ON DELETE RESTRICT,   -- RN-05
  categoria_id       UUID          NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT, -- RN-04
  tipo               VARCHAR(8)    NOT NULL,
  monto              INTEGER       NOT NULL,
  fecha              DATE          NOT NULL,
  es_hormiga         BOOLEAN       NOT NULL DEFAULT false,
  pago_pendiente_id  UUID          REFERENCES pagos(id) ON DELETE RESTRICT,               -- RN-20
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT movimientos_tipo_valido      CHECK (tipo IN ('ingreso', 'gasto')),           -- RN-02
  CONSTRAINT movimientos_monto_positivo   CHECK (monto > 0),                              -- RN-01
  CONSTRAINT movimientos_hormiga_solo_gasto CHECK (es_hormiga = false OR tipo = 'gasto'), -- RN-03
  CONSTRAINT movimientos_pago_solo_gasto    CHECK (pago_pendiente_id IS NULL OR tipo = 'gasto')
);
CREATE INDEX IF NOT EXISTS idx_mov_fecha      ON movimientos (fecha);
CREATE INDEX IF NOT EXISTS idx_mov_miembro    ON movimientos (miembro_id, fecha);
CREATE INDEX IF NOT EXISTS idx_mov_categoria  ON movimientos (categoria_id, fecha);
CREATE INDEX IF NOT EXISTS idx_mov_pago       ON movimientos (pago_pendiente_id);
CREATE INDEX IF NOT EXISTS idx_mov_hormiga    ON movimientos (fecha) WHERE es_hormiga = true;

CREATE TABLE IF NOT EXISTS eventos_presupuesto (
  id           BIGSERIAL     PRIMARY KEY,
  tipo         VARCHAR(30)   NOT NULL,
  detalle      JSONB         NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION presupuesto_actualizar_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_miembros_updated_at ON miembros;
CREATE TRIGGER trg_miembros_updated_at BEFORE UPDATE ON miembros
  FOR EACH ROW EXECUTE FUNCTION presupuesto_actualizar_updated_at();
DROP TRIGGER IF EXISTS trg_categorias_updated_at ON categorias;
CREATE TRIGGER trg_categorias_updated_at BEFORE UPDATE ON categorias
  FOR EACH ROW EXECUTE FUNCTION presupuesto_actualizar_updated_at();
DROP TRIGGER IF EXISTS trg_pagos_updated_at ON pagos;
CREATE TRIGGER trg_pagos_updated_at BEFORE UPDATE ON pagos
  FOR EACH ROW EXECUTE FUNCTION presupuesto_actualizar_updated_at();
```

### 8.3 M2 · Vista de pagos y seguridad

```sql
-- M2: vista de pagos con su abonado y cierre de acceso público

CREATE OR REPLACE VIEW v_pagos
WITH (security_invoker = true) AS
SELECT
  p.*,
  COALESCE(SUM(m.monto), 0)          AS abonado,
  p.monto - COALESCE(SUM(m.monto), 0) AS restante
FROM pagos p
LEFT JOIN movimientos m ON m.pago_pendiente_id = p.id
GROUP BY p.id;

ALTER TABLE miembros            ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias          ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_presupuesto ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON miembros, categorias, pagos, movimientos, eventos_presupuesto FROM anon, authenticated;
REVOKE ALL ON v_pagos FROM anon, authenticated;
```

Las tablas quedan sin políticas: la clave pública de Supabase no puede leerlas ni escribirlas. Todo el acceso ocurre en el servidor mediante la conexión directa a Postgres (RNF4).

### 8.4 Traducción de errores de la base de datos

| Código Postgres | Restricción | Código de negocio |
|---|---|---|
| `23505` | `ux_miembros_nombre` o `ux_categorias_nombre` | `NOMBRE_DUPLICADO` |
| `23503` | llaves foráneas (`ON DELETE RESTRICT`) | `TIENE_MOVIMIENTOS` |
| `23514` | cualquier CHECK | `DATOS_INVALIDOS` |
| Otro | | `ERROR_INTERNO` (se registra en consola, no se muestra al usuario) |

---

## 9. Cálculos

Todos operan con pesos enteros y aritmética entera.

| Cálculo | Fórmula | Regla |
|---|---|---|
| Restante de un pago | `monto − suma de movimientos vinculados` | Sección 4 |
| Saldo del mes | ver sección 4 | RN-08 |
| Días restantes de un pago | `fecha_limite − hoy` (Bogotá), en días | RN-09 |
| Nivel de urgencia | sección 5.2 según días restantes y estado | RN-09 |
| Acumulado de una categoría | suma de gastos del mes en esa categoría | RN-15 |
| Porcentaje de categoría | comparación entera: `acumulado × 100` frente a `porcentaje × limite` | RN-15 |
| Nivel de categoría | sección 5.3 | RN-15 |
| Acumulado hormiga del mes | suma de gastos del mes con `es_hormiga = true` | RN-16 |

La comparación de categoría usa enteros para que el 90 % y el 100 % exactos caigan del lado correcto: `acumulado ≥ 0,9 × limite` se evalúa como `acumulado × 10 ≥ 9 × limite`, y `acumulado ≥ limite` directamente. Así se evita el error de `limite * 0.9` con decimales.

---

## 10. Arquitectura del código

### 10.1 Capas

```text
Pantallas (app/hogar/*) ────┐
                            ├──► Rutas API (app/api/hogar/*) ──► lib/dataService.ts ──► lib/datos/* ──► Postgres
Componentes (components/*) ─┘          │                                 │
                                       └──── lib/validacion (Zod)        └──── lib/reglas/* (funciones puras)
```

- `lib/reglas/`: reglas como funciones puras. No importan `pg`, no leen variables de entorno y no leen el reloj (excepto `fechas.ts`). Se prueban con Vitest.
- `lib/datos/`: consultas SQL y casos de uso con transacciones. Solo este directorio importa `lib/db/conexion.ts`.
- `lib/dataService.ts`: fachada única. Las rutas y páginas importan datos solo desde aquí.
- Rutas API: validan con Zod, verifican sesión, llaman a `dataService` y responden con `lib/http/respuestas.ts`.
- Las páginas (componentes de servidor) pueden leer con `dataService`. Las acciones que modifican datos se hacen desde componentes cliente que llaman a `/api/hogar/*` y luego ejecutan `router.refresh()`.

### 10.2 Árbol de archivos nuevos

```text
.github/copilot-instructions.md
doc/ESTADO_ACTUAL.md
doc/ESTADO_EJECUCION.md
doc/checkpoints/FASE_N_COMPLETADA.md

supabase/migrations/NNNN_casamatute_tablas.sql
supabase/migrations/NNNN_casamatute_vista_seguridad.sql

scripts/migrar.mjs                 (solo si no existe mecanismo de migraciones)
scripts/verificar-bd.mjs
scripts/probar-flujo.ts
scripts/limpiar-prueba.mjs
scripts/cargar-demo.ts

lib/config/presupuesto.ts
lib/reglas/errores.ts
lib/reglas/fechas.ts
lib/reglas/movimiento.ts
lib/reglas/urgencia.ts
lib/reglas/categoria.ts            (opcional, se usa en F5)
lib/reglas/hormiga.ts              (opcional, se usa en F7)
lib/reglas/vinculacion.ts
lib/validacion/esquemas.ts
lib/db/conexion.ts
lib/auth/sesion.ts
lib/http/respuestas.ts
lib/formato.ts
lib/datos/tipos.ts
lib/datos/eventos.ts
lib/datos/catalogos.ts             (miembros y categorías)
lib/datos/pagos.ts
lib/datos/movimientos.ts
lib/datos/saldo.ts
lib/datos/resumen.ts               (opcional, F6)
lib/dataService.ts

tests/reglas/ayudas.ts
tests/reglas/movimiento.test.ts
tests/reglas/urgencia.test.ts
tests/reglas/vinculacion.test.ts
tests/reglas/categoria.test.ts     (F5)
tests/reglas/hormiga.test.ts       (F7)
tests/reglas/fechas.test.ts
vitest.config.ts

app/page.tsx                                  (solo si hoy es la plantilla de Next.js)
app/hogar/layout.tsx
app/hogar/page.tsx                            (panel: alertas de vencimiento)
app/hogar/movimientos/page.tsx
app/hogar/movimientos/nuevo/page.tsx
app/hogar/pagos/page.tsx
app/hogar/pagos/nuevo/page.tsx
app/hogar/catalogos/page.tsx                  (miembros y categorías)
app/hogar/saldo/page.tsx                      (opcional, F3)
app/hogar/resumen/page.tsx                    (opcional, F6)

app/api/hogar/sesion/route.ts
app/api/hogar/panel/route.ts
app/api/hogar/movimientos/route.ts
app/api/hogar/pagos/route.ts
app/api/hogar/pagos/[id]/route.ts
app/api/hogar/miembros/route.ts
app/api/hogar/miembros/[id]/route.ts
app/api/hogar/categorias/route.ts
app/api/hogar/categorias/[id]/route.ts
app/api/hogar/saldo/route.ts                  (opcional, F3)
app/api/hogar/resumen/route.ts                (opcional, F6)

components/ui/Boton.tsx
components/ui/Campo.tsx
components/ui/Selector.tsx
components/ui/Tarjeta.tsx
components/ui/Insignia.tsx
components/ui/Aviso.tsx
components/ui/Modal.tsx
components/ui/EstadoVacio.tsx
components/hogar/NavegacionHogar.tsx
components/hogar/InsigniaUrgencia.tsx
components/hogar/InsigniaEstadoPago.tsx
components/hogar/TablaAlertas.tsx
components/hogar/FormularioMovimiento.tsx
components/hogar/SelectorPago.tsx
components/hogar/FormularioPago.tsx
components/hogar/TablaPagos.tsx
components/hogar/TablaMovimientos.tsx
components/hogar/FiltrosMovimientos.tsx
components/hogar/FormularioMiembro.tsx
components/hogar/FormularioCategoria.tsx
components/hogar/TarjetaSaldo.tsx             (opcional)
components/hogar/InsigniaCategoria.tsx        (opcional)
components/hogar/TablaResumen.tsx             (opcional)
components/hogar/AvisoHormiga.tsx             (opcional)
```

### 10.3 Responsabilidades y prohibiciones

| Regla de código | Motivo |
|---|---|
| Identificadores, comentarios y mensajes en español | Coherencia con el dominio y con el plan funcional |
| Las reglas solo viven en `lib/reglas/` | Una sola fuente de verdad, probada con Vitest |
| Los umbrales se leen de `lib/config/presupuesto.ts` | RNF5 |
| Montos con aritmética entera; nunca `limite * 0.9` con decimales | Sección 9 |
| Solo `lib/datos/` importa `lib/db/conexion.ts` | Las rutas no escriben SQL |
| Las rutas solo importan datos desde `lib/dataService.ts` | Fachada única |
| Toda ruta `/api/hogar/*` llama `exigirSesion()` como primera instrucción | RNF4 |
| El saldo y el estado del pago se calculan dentro de la transacción del movimiento, con bloqueo | RN-08, RN-11 |
| Montos como `number` entero en pesos; nunca decimales | Sección 14 |
| Fechas como texto `YYYY-MM-DD` entre capas | Evita errores de zona horaria (sección 14) |
| `params` de rutas dinámicas se obtiene con `await params` | Next.js 15 y 16 entregan `params` como Promise |
| No modificar archivos del login salvo la redirección indicada en P03 | Sección 1.3 |

### 10.4 Configuración

```ts
// lib/config/presupuesto.ts
// Umbrales ajustables sin tocar la lógica (RNF5).

export const ZONA_HORARIA = 'America/Bogota';

// Urgencia de pagos (días restantes). Ver sección 5.2.
export const DIAS_VERDE_MINIMO = 8;        // 8 o más → verde
export const DIAS_AMARILLO_MINIMO = 3;     // 3 a 7 → amarillo
// 2 o menos → rojo; negativo → vencido

// Categoría (porcentaje del límite mensual). Ver sección 5.3.
export const PORCENTAJE_CATEGORIA_AMARILLO = 90;   // desde 90 % → amarillo
export const PORCENTAJE_CATEGORIA_ROJO = 100;      // desde 100 % → rojo

// Gastos hormiga.
export const UMBRAL_HORMIGA = 100_000;     // pesos; al alcanzarlo, aviso

export const LIMITE_LISTADO = 500;         // filas máximas por consulta
```

### 10.5 Firmas de las reglas puras

```ts
// lib/reglas/errores.ts
export type CodigoError =
  | 'DATOS_INVALIDOS' | 'NO_AUTORIZADO'
  | 'MIEMBRO_INVALIDO' | 'CATEGORIA_INVALIDA' | 'NOMBRE_DUPLICADO' | 'TIENE_MOVIMIENTOS'
  | 'FECHA_NO_FUTURA' | 'PAGO_NO_ENCONTRADO' | 'PAGO_YA_PAGADO' | 'PAGO_NO_ELIMINABLE'
  | 'MONTO_NO_EDITABLE' | 'MONTO_EXCEDE_RESTANTE' | 'SALDO_INSUFICIENTE' | 'ERROR_INTERNO';
export const MENSAJES: Record<CodigoError, string>;     // sección 11.2
export const ESTADO_HTTP: Record<CodigoError, number>;  // sección 11.2
export class ErrorDeNegocio extends Error {
  constructor(public codigo: CodigoError, mensaje?: string, public detalles?: unknown);
}

// lib/reglas/fechas.ts
export function hoyBogota(reloj?: Date): string;                   // 'YYYY-MM-DD'
export function esFechaValida(fecha: string): boolean;
export function esFechaFutura(fecha: string, hoy: string): boolean;
export function diasRestantes(fechaLimite: string, hoy: string): number;   // fechaLimite - hoy
export function inicioYFinDeMes(hoy: string): { inicio: string; fin: string };

// lib/reglas/movimiento.ts
export type TipoMovimiento = 'ingreso' | 'gasto';
export function validarMovimiento(d: {
  tipo: TipoMovimiento; monto: number; fecha: string;
  esHormiga: boolean; pagoPendienteId: string | null;
}): void;
// monto entero > 0; tipo válido; si tipo es 'ingreso', esHormiga false y pagoPendienteId null (RN-03)

// lib/reglas/urgencia.ts
export type NivelUrgencia = 'verde' | 'amarillo' | 'rojo' | 'vencido';
export function nivelUrgencia(diasRestantes: number): NivelUrgencia;       // sección 5.2
export const ORDEN_URGENCIA: Record<NivelUrgencia, number>;               // vencido=0, rojo=1, amarillo=2, verde=3
export const ETIQUETA_URGENCIA: Record<NivelUrgencia, string>;

// lib/reglas/vinculacion.ts
export function resolverMontoVinculado(d: { abonable: boolean; montoEnviado: number; restante: number }): number;
// no abonable → restante (ignora lo enviado); abonable → montoEnviado
export function validarVinculacion(d: { abonable: boolean; montoEnviado: number; restante: number }): void;
// no abonable: el movimiento no se edita (el servidor usa el restante); abonable: montoEnviado > 0
export function estadoTrasAbono(totalAbonado: number, montoPago: number): 'pendiente' | 'pagado'; // ≥ total → pagado (RN-11)

// lib/reglas/categoria.ts  (F5)
export type NivelCategoria = 'normal' | 'amarillo' | 'rojo';
export function nivelCategoria(acumulado: number, limite: number | null): NivelCategoria;  // sección 5.3, enteros

// lib/reglas/hormiga.ts  (F7)
export function superaUmbralHormiga(acumulado: number): boolean;          // acumulado ≥ UMBRAL_HORMIGA
```

### 10.6 Firmas de `dataService`

```ts
// Sesión
obtenerSesion(): Promise<{ email: string } | null>

// Catálogos
listarMiembros(f?: { incluirInactivos?: boolean }): Promise<FilaMiembro[]>
crearMiembro(nombre: string): Promise<{ id: string }>
actualizarMiembro(id: string, cambios: { nombre?: string; activo?: boolean }): Promise<void>
listarCategorias(f?: { incluirInactivos?: boolean }): Promise<FilaCategoria[]>
crearCategoria(d: { nombre: string; limiteMensual: number | null }): Promise<{ id: string }>
actualizarCategoria(id: string, cambios: { nombre?: string; limiteMensual?: number | null; activo?: boolean }): Promise<void>

// Pagos
listarPagos(f?: { estado?: EstadoPago }): Promise<FilaPago[]>
crearPago(d: DatosPago): Promise<{ id: string }>
eliminarPago(id: string): Promise<void>                           // PAGO_NO_ELIMINABLE
obtenerAlertasVencimiento(): Promise<FilaAlerta[]>                 // pagos pendientes con nivel, ordenados

// Movimientos
registrarMovimiento(d: DatosMovimiento, miembroSesion: string): Promise<ResultadoMovimiento>
listarMovimientos(f: { miembroId?: string; categoriaId?: string; desde?: string; hasta?: string }): Promise<FilaMovimiento[]>

// Saldo y panel
calcularSaldo(): Promise<DesgloseSaldo>
obtenerPanel(): Promise<PanelHogar>

// Opcionales
obtenerEstadoCategorias(): Promise<FilaEstadoCategoria[]>          // F5
obtenerAcumuladoHormiga(): Promise<{ acumulado: number; supera: boolean }>  // F7
obtenerResumen(f: { desde: string; hasta: string; miembroId?: string; categoriaId?: string }): Promise<ResumenAgrupado>  // F6
```

### 10.7 Conexión y transacciones

```ts
// lib/db/conexion.ts
import { Pool, types, type PoolClient } from 'pg';

types.setTypeParser(1082, (v) => v);                 // DATE → 'YYYY-MM-DD'
types.setTypeParser(1114, (v) => v);                 // TIMESTAMP → texto
types.setTypeParser(20, (v) => parseInt(v, 10));     // BIGINT (ids, COUNT y SUM) → number

const globalParaPool = globalThis as unknown as { poolCasaMatute?: Pool };

export const pool = globalParaPool.poolCasaMatute ?? new Pool({
  connectionString: process.env.DATABASE_URL,        // el nombre real lo confirma P00
  ssl: { rejectUnauthorized: true },
  max: 3,
  idleTimeoutMillis: 10_000,
});
if (process.env.NODE_ENV !== 'production') globalParaPool.poolCasaMatute = pool;

export async function consultar<T>(sql: string, valores: unknown[] = []): Promise<T[]> { /* pool.query */ }

export async function conTransaccion<T>(trabajo: (tx: PoolClient) => Promise<T>): Promise<T> {
  // BEGIN → trabajo(tx) → COMMIT; en error: ROLLBACK y relanzar; siempre release()
}
```

`SUM(monto)` en Postgres sobre `INTEGER` devuelve `BIGINT`; el parser lo convierte a número. Como todos los montos son enteros, no hace falta parser para `NUMERIC`.

---

## 11. Contratos de API

### 11.1 Formato de respuesta

```json
{ "ok": true, "datos": { } }
```

```json
{ "ok": false, "error": { "codigo": "SALDO_INSUFICIENTE", "mensaje": "El gasto dejaría el saldo del hogar en negativo.", "detalles": { "saldoDisponible": 50000 } } }
```

Todas las respuestas llevan `Cache-Control: no-store`.

### 11.2 Códigos de error

| Código | HTTP | Mensaje para el usuario |
|---|---|---|
| `DATOS_INVALIDOS` | 400 | Revise los datos ingresados. |
| `NO_AUTORIZADO` | 401 | Debe iniciar sesión. |
| `MIEMBRO_INVALIDO` | 422 | El miembro seleccionado no existe o está inactivo. |
| `CATEGORIA_INVALIDA` | 422 | La categoría seleccionada no existe o está inactiva. |
| `NOMBRE_DUPLICADO` | 409 | Ya existe un registro con ese nombre. |
| `TIENE_MOVIMIENTOS` | 409 | No se puede eliminar: tiene movimientos asociados. |
| `FECHA_NO_FUTURA` | 422 | La fecha límite debe ser una fecha futura. |
| `PAGO_NO_ENCONTRADO` | 404 | El pago no existe. |
| `PAGO_YA_PAGADO` | 409 | Este pago ya está saldado. |
| `PAGO_NO_ELIMINABLE` | 409 | Solo se puede eliminar un pago pendiente sin movimientos. |
| `MONTO_NO_EDITABLE` | 422 | El monto de un pago no abonable no se puede modificar. |
| `MONTO_EXCEDE_RESTANTE` | 422 | El abono no puede superar el monto restante del pago. |
| `SALDO_INSUFICIENTE` | 409 | El gasto dejaría el saldo del hogar en negativo. |
| `ERROR_INTERNO` | 500 | Ocurrió un error inesperado. Intente de nuevo. |

Los mensajes con `{...}` se completan con los valores de `detalles`.

### 11.3 Endpoints (todos requieren sesión)

| Método y ruta | Cuerpo o parámetros | Respuesta `datos` |
|---|---|---|
| `GET /api/hogar/sesion` | | `{ email }` |
| `GET /api/hogar/panel` | | `PanelHogar` (alertas, saldo, acumulado hormiga si F7) |
| `GET /api/hogar/movimientos?miembroId=&categoriaId=&desde=&hasta=` | | `FilaMovimiento[]` |
| `POST /api/hogar/movimientos` | `{ miembroId, categoriaId, tipo, monto, fecha, esHormiga?, pagoPendienteId? }` | `ResultadoMovimiento` (201) |
| `GET /api/hogar/pagos?estado=` | | `FilaPago[]` |
| `POST /api/hogar/pagos` | `{ nombre, monto, fechaLimite, recurrente, abonable }` | `{ id }` (201) |
| `DELETE /api/hogar/pagos/[id]` | | `{ eliminado: true }` |
| `GET /api/hogar/miembros?incluirInactivos=` | | `FilaMiembro[]` |
| `POST /api/hogar/miembros` | `{ nombre }` | `{ id }` (201) |
| `PATCH /api/hogar/miembros/[id]` | `{ nombre?, activo? }` | `{ actualizado: true }` |
| `GET /api/hogar/categorias?incluirInactivos=` | | `FilaCategoria[]` |
| `POST /api/hogar/categorias` | `{ nombre, limiteMensual }` | `{ id }` (201) |
| `PATCH /api/hogar/categorias/[id]` | `{ nombre?, limiteMensual?, activo? }` | `{ actualizado: true }` |
| `GET /api/hogar/saldo` | | `DesgloseSaldo` (opcional, F3) |
| `GET /api/hogar/resumen?desde=&hasta=&miembroId=&categoriaId=` | | `ResumenAgrupado` (opcional, F6) |

### 11.4 Esquemas Zod (`lib/validacion/esquemas.ts`)

| Esquema | Reglas |
|---|---|
| `esquemaMovimiento` | miembroId uuid, categoriaId uuid, tipo enum, monto entero ≥ 1, fecha válida, esHormiga booleano opcional, pagoPendienteId uuid opcional. Refinamiento: si tipo es `ingreso`, esHormiga debe ser false y pagoPendienteId ausente |
| `esquemaPago` | nombre (2 a 120), monto entero ≥ 1, fechaLimite válida, recurrente booleano, abonable booleano |
| `esquemaMiembro` | nombre (2 a 80) |
| `esquemaCategoria` | nombre (2 a 80), limiteMensual entero ≥ 1 o null |
| `esquemaCambiosMiembro` | nombre, activo opcionales; al menos uno |
| `esquemaCambiosCategoria` | nombre, limiteMensual (entero ≥ 1 o null), activo opcionales; al menos uno |
| `esquemaFiltrosMovimientos` | miembroId, categoriaId, desde, hasta opcionales |
| `esquemaFiltrosResumen` | desde y hasta requeridos; miembroId, categoriaId opcionales |

La validación de fecha futura, saldo y vinculación se hace en `lib/reglas/` porque dependen del estado guardado.

---

## 12. Pantallas

| Ruta | Contenido |
|---|---|
| Layout `/hogar` | Verifica la sesión con `obtenerSesion()`; sin sesión redirige al login. Barra con "Casa Matute", navegación (Panel, Movimientos, Pagos, Catálogos; Saldo, Resumen cuando estén activos), correo del usuario y botón de cerrar sesión del login. Menú desplegable en móvil. |
| `/hogar` · Panel | Vista principal, resuelve CU2. `TablaAlertas` de pagos pendientes con `InsigniaUrgencia`, ordenada vencidos y rojos primero. Tarjeta de saldo del mes (del módulo mínimo, soporta RF8). Si F7 está activo, `AvisoHormiga` cuando el acumulado del mes supera el umbral. Accesos rápidos a "Registrar movimiento" y "Registrar pago". `EstadoVacio` si no hay pagos. |
| `/hogar/movimientos` · Movimientos | `FiltrosMovimientos` (miembro, categoría, rango de fechas) en la URL. `TablaMovimientos`: fecha, miembro, categoría, tipo, monto, marca de hormiga, pago vinculado. Botón "Registrar movimiento". |
| `/hogar/movimientos/nuevo` · Registrar movimiento | `FormularioMovimiento`: tipo (ingreso o gasto); miembro; categoría; monto; fecha (por defecto hoy); si es gasto, casilla "gasto hormiga" y `SelectorPago` opcional. Al elegir un pago no abonable, el monto se autocompleta con el restante y se bloquea (RN-10); si es abonable, el monto queda libre y se muestra el restante como referencia. Antes de confirmar, para un gasto, muestra el saldo actual y advierte si el monto lo dejaría en negativo. Tras guardar, `Aviso` con el saldo nuevo y, si el pago quedó saldado, lo indica. |
| `/hogar/pagos` · Pagos | `TablaPagos`: nombre, monto, abonado, restante, fecha límite, `InsigniaUrgencia`, `InsigniaEstadoPago`, abonable. Acción "Eliminar" solo en pagos pendientes sin movimientos. Botón "Registrar pago". |
| `/hogar/pagos/nuevo` · Registrar pago | `FormularioPago`: nombre, monto, fecha límite (mínimo mañana), casillas recurrente y abonable. Resuelve CU5. |
| `/hogar/catalogos` · Catálogos | Dos secciones: Miembros (`FormularioMiembro`, tabla con activar/desactivar) y Categorías (`FormularioCategoria` con límite mensual, tabla con activar/desactivar). Desactivar en lugar de eliminar cuando hay movimientos. |
| `/hogar/saldo` · Saldo (opcional) | `TarjetaSaldo` con el desglose de la sección 4: ingresos del mes, gastos del mes, pagos pendientes del mes y saldo resultante. |
| `/hogar/resumen` · Resumen (opcional) | `TablaResumen` agrupada por miembro y por categoría en el rango elegido; totales. |

Las clasificaciones de categoría (F5) se muestran en Catálogos y en el panel cuando el módulo está activo, con `InsigniaCategoria`.

Si `app/page.tsx` es la plantilla de Next.js, se reemplaza por una redirección a `/hogar`. Si tiene contenido propio, se agrega un enlace a `/hogar`.

### 12.1 Textos fijos

Advertencia de saldo en el formulario de gasto:

> Saldo disponible del mes: {saldo}. Este gasto lo dejaría en {resultante}.

Autocompletado de pago no abonable:

> Este pago no admite abonos parciales. Se registrará por su monto restante de {restante} y quedará saldado.

---

## 13. Identidad visual

| Token | Valor | Uso |
|---|---|---|
| `--color-primario` | `#3A5A7A` | Botones principales, barra superior |
| `--color-primario-suave` | `#E8EEF4` | Fondos de selección, hover |
| `--color-ingreso` | `#2F7D4F` | Movimientos de ingreso, saldo positivo |
| `--color-gasto` | `#B85C38` | Movimientos de gasto |
| `--color-verde` | `#2F7D4F` | Urgencia verde |
| `--color-amarillo` | `#B7791F` | Urgencia amarilla, categoría al 90 % |
| `--color-rojo` | `#B83232` | Urgencia roja, vencido, categoría al 100 %, errores, saldo negativo |
| `--color-fondo` | `#F5F6F8` | Fondo de página |
| `--color-superficie` | `#FFFFFF` | Tarjetas, tablas, modales |
| `--color-texto` | `#1F2933` | Texto principal |
| `--color-texto-suave` | `#52606D` | Texto secundario |
| `--color-borde` | `#D9DEE4` | Bordes y divisores |

Los tokens se agregan a `app/globals.css` sin borrar estilos existentes del login. Con Tailwind 4 se declaran en `@theme`; con Tailwind 3, en `tailwind.config`.

| Insignia | Fondo / texto |
|---|---|
| Urgencia verde | verde claro / `--color-verde` |
| Urgencia amarilla | ámbar claro / `--color-amarillo` |
| Urgencia roja | rojo claro / `--color-rojo` |
| Vencido | rojo / blanco |
| Estado pendiente | gris claro / gris oscuro |
| Estado pagado | verde claro / `--color-verde` |
| Categoría 90 % / 100 % | ámbar / rojo claro |

Criterios: tipografía del proyecto (si no hay, Inter con `next/font`); montos con fuente de ancho fijo (`tabular-nums`); montos con `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })`; fechas con `Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'UTC' })` sobre fechas `YYYY-MM-DD`; bordes redondeados de 8 px; sin emojis; tablas convertidas en tarjetas apiladas en pantallas menores a 640 px. La urgencia y el tipo de movimiento nunca se comunican solo con color: la insignia o la etiqueta siempre llevan texto.

---

## 14. Dinero, fechas y zona horaria

| Regla | Implementación |
|---|---|
| Montos | Pesos enteros (`INTEGER` en la base, `number` entero en el código). El peso no usa centavos; los enteros evitan errores de redondeo en saldos y porcentajes |
| Presentación de montos | `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })` → "$ 100.000" |
| "Hoy" y el mes en curso | Solo con `hoyBogota()` e `inicioYFinDeMes()` (usan `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' })`) |
| Fechas entre capas | Texto `YYYY-MM-DD` |
| Lectura desde BD | Parsers de `pg` devuelven texto (sección 10.7) |
| Días restantes | `diasRestantes` con `Date.UTC` sobre ambas fechas, dividido entre 86 400 000 |
| Fecha límite de un pago | El formulario limita `min` a mañana; el dominio exige fecha futura (RN-06) |
| Comparaciones de porcentaje | Aritmética entera (sección 9), nunca `limite * 0.9` |

Vercel ejecuta el servidor en UTC; Colombia está en UTC-5 sin horario de verano. Si "hoy" se calcula en UTC, entre las 19:00 y la medianoche los días restantes de un pago y el límite del mes se desplazarían un día, cambiando el nivel de urgencia y el saldo.

---

## 15. Seguridad e integridad

| Medida | Detalle |
|---|---|
| Cambio de la credencial expuesta | Obligatorio y previo (sección 2) |
| Acceso solo con sesión | Middleware o proxy existente y `exigirSesion()` en cada ruta de `/api/hogar` (RNF4) |
| Base de datos cerrada al público | RLS activo sin políticas y permisos revocados a `anon` y `authenticated` |
| Saldo e integridad del pago | Se calculan dentro de la transacción del movimiento, con los pagos bloqueados (`FOR UPDATE`), para que dos registros simultáneos no dejen el saldo negativo ni abonen de más (RN-08, RN-11) |
| Validación en tres puntos | Formulario (Zod y reglas puras), API (Zod y reglas puras) y base de datos (CHECK, UNIQUE, llaves foráneas) |
| Movimientos inmutables | No existe ruta para editarlos ni eliminarlos |
| SQL parametrizado | Ningún valor se concatena en una consulta |
| Umbrales en configuración | Ajustables sin tocar la lógica (RNF5) |
| Errores internos | Se registran con `console.error` en el servidor; el usuario recibe `ERROR_INTERNO` sin detalles técnicos |

---

## 16. Pruebas

### 16.1 Pruebas unitarias de reglas (Vitest)

Fecha de referencia: `hoy = '2030-06-15'`.

| ID | Función | Entrada | Resultado esperado |
|---|---|---|---|
| T-01 | `validarMovimiento` | gasto, monto 0 | `DATOS_INVALIDOS` |
| T-02 | `validarMovimiento` | gasto, monto -100 | `DATOS_INVALIDOS` |
| T-03 | `validarMovimiento` | gasto, monto 1500,5 | `DATOS_INVALIDOS` |
| T-04 | `validarMovimiento` | ingreso con esHormiga true | `DATOS_INVALIDOS` (RN-03) |
| T-05 | `validarMovimiento` | ingreso con pagoPendienteId presente | `DATOS_INVALIDOS` (RN-03) |
| T-06 | `validarMovimiento` | gasto válido con hormiga y pago | sin error |
| T-07 | `diasRestantes` | `'2030-06-20'`, hoy `'2030-06-15'` | 5 |
| T-08 | `diasRestantes` | `'2030-06-15'`, hoy `'2030-06-15'` | 0 |
| T-09 | `diasRestantes` | `'2030-06-10'`, hoy `'2030-06-15'` | -5 |
| T-10 | `nivelUrgencia` | 8 | `verde` |
| T-11 | `nivelUrgencia` | 7 | `amarillo` |
| T-12 | `nivelUrgencia` | 3 | `amarillo` |
| T-13 | `nivelUrgencia` | 2 | `rojo` |
| T-14 | `nivelUrgencia` | 0 | `rojo` |
| T-15 | `nivelUrgencia` | -1 | `vencido` |
| T-16 | `nivelUrgencia` | 5 | `amarillo` (HU1) |
| T-17 | `resolverMontoVinculado` | no abonable, enviado 999, restante 300.000 | 300.000 (ignora lo enviado, RN-10) |
| T-18 | `resolverMontoVinculado` | abonable, enviado 150.000, restante 300.000 | 150.000 |
| T-19 | `validarVinculacion` | abonable, enviado 0 | `DATOS_INVALIDOS` |
| T-20 | `estadoTrasAbono` | abonado 150.000, monto 300.000 | `pendiente` |
| T-21 | `estadoTrasAbono` | abonado 300.000, monto 300.000 | `pagado` (igualar basta, RN-11) |
| T-22 | `estadoTrasAbono` | abonado 320.000, monto 300.000 | `pagado` |
| T-23 | `esFechaFutura` | `'2030-06-16'`, hoy `'2030-06-15'` | `true` |
| T-24 | `esFechaFutura` | `'2030-06-15'`, hoy `'2030-06-15'` | `false` |
| T-25 | `inicioYFinDeMes` | hoy `'2030-06-15'` | `{ inicio: '2030-06-01', fin: '2030-06-30' }` |

Pruebas de los módulos opcionales (se agregan con F5 y F7):

| ID | Función | Entrada | Resultado esperado |
|---|---|---|---|
| T-26 | `nivelCategoria` | acumulado 89.999, límite 100.000 | `normal` |
| T-27 | `nivelCategoria` | acumulado 90.000, límite 100.000 | `amarillo` (exactamente 90 %) |
| T-28 | `nivelCategoria` | acumulado 99.999, límite 100.000 | `amarillo` |
| T-29 | `nivelCategoria` | acumulado 100.000, límite 100.000 | `rojo` |
| T-30 | `nivelCategoria` | acumulado 50.000, límite null | `normal` (sin límite) |
| T-31 | `nivelCategoria` | acumulado 300, límite 333 (90 % = 299,7) | `amarillo` (300 ≥ 299,7, con enteros) |
| T-32 | `superaUmbralHormiga` | 99.999 | `false` |
| T-33 | `superaUmbralHormiga` | 100.000 | `true` (exactamente el umbral) |

Comando: `npm test`. En el módulo mínimo deben pasar T-01 a T-25 (25 pruebas).

### 16.2 Prueba de flujo contra la base de datos

`scripts/probar-flujo.ts` (`npm run probar:flujo`) usa `dataService` con nombres `Prueba *`. Imprime `OK` o `FALLA` por paso y limpia al final. La fecha de los movimientos es hoy (Bogotá), para que entren en el mes en curso.

| Paso | Operación | Esperado |
|---|---|---|
| 1 | Crear miembro "Prueba Ana" y categoría "Prueba Mercado" (límite 500.000) | Creados |
| 2 | Registrar ingreso de 1.000.000 (Ana, Mercado, hoy) | Saldo 1.000.000 |
| 3 | Registrar gasto de 300.000 | Saldo 700.000 |
| 4 | Registrar gasto de 800.000 | `SALDO_INSUFICIENTE`; saldo sigue 700.000 |
| 5 | Crear pago "Prueba Arriendo" monto 700.000, no abonable, fecha límite dentro de 5 días | Creado, pendiente |
| 6 | Alertas de vencimiento | "Prueba Arriendo" en nivel amarillo |
| 7 | Registrar gasto vinculado a "Prueba Arriendo" enviando monto 1 | El monto se ajusta a 700.000 (RN-10); el pago queda `pagado`; saldo 0 |
| 8 | Registrar otro gasto de 1 | `SALDO_INSUFICIENTE` (saldo 0) |
| 9 | Crear pago "Prueba Tarjeta" monto 300.000, abonable, fecha límite dentro de 20 días | Creado |
| 10 | Registrar ingreso de 300.000; abonar 150.000 a "Prueba Tarjeta" | Pago sigue `pendiente`, restante 150.000 |
| 11 | Abonar 150.000 más | Pago `pagado` (HU3) |
| 12 | Intentar abonar a "Prueba Tarjeta" | `PAGO_YA_PAGADO` |
| 13 | Eliminar "Prueba Arriendo" (tiene movimiento) | `PAGO_NO_ELIMINABLE` |
| 14 | Crear pago "Prueba Vacío" y eliminarlo | Eliminado |

### 16.3 Aceptación (criterio de terminado)

Se ejecuta en el despliegue de Vercel y se documenta en `doc/ACEPTACION.md`.

| ID | Acción | Resultado esperado |
|---|---|---|
| A-01 | Entrar sin sesión a `/hogar` | Redirección al login |
| A-02 | Crear los miembros "Ana" y "Luis" y las categorías "Mercado" (límite 500.000) y "Servicios" (límite 300.000) | Aparecen en Catálogos |
| A-03 | Registrar un ingreso de 2.000.000 | Queda en Movimientos |
| A-04 | Registrar un pago "Arriendo" de 900.000, no abonable, con fecha límite dentro de 5 días | Aparece en Pagos, nivel amarillo |
| A-05 | Registrar un pago "Internet" con fecha límite dentro de 1 día | Nivel rojo |
| A-06 | Registrar un pago con fecha de ayer y dejarlo sin pagar (si el sistema no permite fecha pasada al crear, crear uno a 1 día y esperar, o ajustar en datos de prueba) | Aparece como vencido |
| A-07 | En el panel, ver las alertas ordenadas con vencidos y rojos primero | Orden correcto |
| A-08 | Intentar un gasto de 3.000.000 (mayor al saldo) | Rechazo por saldo insuficiente, con el motivo |
| A-09 | Registrar un gasto de 900.000 vinculado a "Arriendo" | El monto se autocompleta y no se edita; "Arriendo" pasa a pagado |
| A-10 | Crear "Tarjeta" abonable de 300.000; abonar 150.000 | Sigue pendiente, restante 150.000 |
| A-11 | Abonar otros 150.000 a "Tarjeta" | Pasa a pagado automáticamente |
| A-12 | Intentar eliminar "Arriendo" | Rechazo: tiene movimientos |
| A-13 | Registrar un gasto marcado como hormiga de 60.000 y otro de 50.000 (F7) | Aviso al llegar o pasar 100.000 |
| A-14 | Registrar gastos en "Mercado" hasta el 90 % del límite (F5) | La categoría se marca amarilla |
| A-15 | Superar el 100 % de "Mercado" (F5) | La categoría se marca roja |
| A-16 | Abrir la pantalla de Saldo (F3) | Desglose de ingresos, gastos, pagos del mes y saldo |
| A-17 | Resumen por miembro y categoría en el mes (F6) | Totales por Ana y Luis y por categoría |
| A-18 | Cerrar el navegador y volver a entrar | Los datos persisten |

A-13 a A-17 corresponden a las funcionalidades opcionales; se verifican tras P09 y P10.

---

## 17. Plan de ejecución

| Fase | Prompt | Resultado | Cierre |
|---|---|---|---|
| 0 · Preparación | P00 | Credencial expuesta cambiada; `ESTADO_ACTUAL.md`, `copilot-instructions.md`, `ESTADO_EJECUCION.md`; compilación de base verificada | `FASE_0_COMPLETADA.md` |
| 1 · Base de datos | P01 | M1 y M2 aplicadas; `npm run db:verificar` sin fallas | `FASE_1_COMPLETADA.md` |
| 2 · Reglas | P02 | `lib/config`, `lib/reglas` (mínimo + opcionales), 33 pruebas en verde | `FASE_2_COMPLETADA.md` |
| 3 · Servidor | P03 | Conexión, sesión, respuestas, esquemas, formato; `/api/hogar/sesion` protegido | `FASE_3_COMPLETADA.md` |
| 4 · Datos y API | P04, P05 | `lib/datos/*`, `dataService`, rutas; `npm run probar:flujo` sin fallas | `FASE_4_COMPLETADA.md` |
| 5 · Interfaz mínima | P06, P07, P08 | Componentes base, navegación, catálogos, pagos, panel de alertas, movimientos | `FASE_5_COMPLETADA.md` |
| 6 · Aceptación del mínimo | (en P08) | `ACEPTACION.md` con A-01 a A-12 y A-18; README | `FASE_6_COMPLETADA.md` |
| 7 · Opcionales | P09, P10 | Saldo, alertas de categoría, resumen, gastos hormiga | `FASE_7_COMPLETADA.md` |

Condiciones entre fases:

- No se inicia una fase si la anterior no tiene su archivo de cierre.
- `npm run build` debe terminar sin errores al final de cada prompt.
- `npm test` debe pasar al final de cada prompt desde P02.
- Cada prompt termina con un commit del estudiante y un `git push`; Vercel despliega en cada push y un fallo de despliegue se corrige antes del siguiente prompt.

---

## 18. Funcionalidades opcionales

Se construyen solo con la fase 6 cerrada.

| Prompt | Funcionalidad | Implementación |
|---|---|---|
| P09 | F3 · Saldo del hogar | `GET /api/hogar/saldo` y `/hogar/saldo` con el desglose de la sección 4 (ya calculado por `lib/datos/saldo.ts` desde el módulo mínimo); `TarjetaSaldo` también en el panel |
| P09 | F5 · Alerta de categoría | `lib/reglas/categoria.ts` (pruebas T-26 a T-31); `obtenerEstadoCategorias` suma los gastos del mes por categoría; `InsigniaCategoria` en Catálogos y en el panel; aviso al 90 % y al 100 % |
| P10 | F6 · Resumen por miembro y categoría | `lib/datos/resumen.ts`, `GET /api/hogar/resumen`, `/hogar/resumen` con `TablaResumen` agrupada y totales |
| P10 | F7 · Gastos hormiga | `lib/reglas/hormiga.ts` (pruebas T-32, T-33); `obtenerAcumuladoHormiga` suma los gastos del mes con `es_hormiga`; `AvisoHormiga` en el panel y en el formulario de movimiento al marcar la casilla |

Fuera de alcance de los opcionales, documentado: la generación automática de pagos recurrentes (el campo `recurrente` se guarda pero no dispara nada) y la edición o eliminación de movimientos.

---

## 19. Glosario

| Término | Definición |
|---|---|
| Movimiento | Un ingreso o un gasto registrado, atribuido a un miembro y una categoría |
| Pago pendiente (obligación) | Una deuda con monto y fecha límite, que se salda con uno o varios movimientos |
| Abonable | Un pago que admite varios abonos parciales; si no lo es, se salda con un solo movimiento por el total |
| Restante de un pago | Su monto menos la suma de los movimientos vinculados |
| Saldo del hogar | Ingresos del mes menos gastos del mes menos el restante de los pagos pendientes del mes (sección 4) |
| Nivel de urgencia | Clasificación informativa de un pago pendiente según los días hasta su fecha límite |
| Gasto hormiga | Gasto pequeño marcado por el usuario; su acumulado mensual se vigila contra un umbral |
| Regla pura | Función de `lib/reglas/` que solo depende de sus parámetros |
| Transacción | Conjunto de escrituras que se confirma completo o se revierte completo |
| Copilot en modo Agente | Modo de GitHub Copilot Chat que lee el repositorio, edita varios archivos y ejecuta comandos de terminal con aprobación |

# Fase 1 completada · Base de datos

## Resultado

- M1 y M2 aplicadas en `supabase/migrations/`.
- Migraciones de autenticación preexistentes registradas en `_migrations` sin reejecución.
- `npm run db:verificar`: cero fallas; todas las tablas y la vista existen; RLS activo en las cinco tablas; la transacción de integridad terminó con `ROLLBACK`.
- `npm run build`: correcto.
- `npm test`: correcto (1 archivo, 2 pruebas).

## Nota sobre RN-02

El SQL rector define `movimientos.tipo` como `VARCHAR(8)`. El literal `'transferencia'` produce SQLSTATE `22001` por exceder esa longitud, antes de alcanzar el CHECK. Para demostrar que el CHECK de RN-02 rechaza un tipo no permitido con SQLSTATE `23514`, la verificación también inserta `'transfer'`, que cabe en la columna. El SQL de la migración se mantuvo exactamente como en el plan.

## Salida de `npm run db:verificar`

```text
> casamatute-layana@0.1.0 db:verificar
> node --env-file=.env.local scripts/verificar-bd.mjs

No se pudo conectar con CASAMATUTELAYANA_POSTGRES_URL (timeout); se usará CASAMATUTELAYANA_POSTGRES_URL_NON_POOLING.
Existencia:
- miembros: sí
- categorias: sí
- pagos: sí
- movimientos: sí
- eventos_presupuesto: sí
- v_pagos: sí
Filas:
- miembros: 0
- categorias: 0
- pagos: 0
- movimientos: 0
- eventos_presupuesto: 0
Restricciones de movimientos y pagos:
- movimientos.movimientos_categoria_id_fkey (f): FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
- movimientos.movimientos_hormiga_solo_gasto (c): CHECK (((es_hormiga = false) OR ((tipo)::text = 'gasto'::text)))
- movimientos.movimientos_miembro_id_fkey (f): FOREIGN KEY (miembro_id) REFERENCES miembros(id) ON DELETE RESTRICT
- movimientos.movimientos_monto_positivo (c): CHECK ((monto > 0))
- movimientos.movimientos_pago_pendiente_id_fkey (f): FOREIGN KEY (pago_pendiente_id) REFERENCES pagos(id) ON DELETE RESTRICT
- movimientos.movimientos_pago_solo_gasto (c): CHECK (((pago_pendiente_id IS NULL) OR ((tipo)::text = 'gasto'::text)))
- movimientos.movimientos_pkey (p): PRIMARY KEY (id)
- movimientos.movimientos_tipo_valido (c): CHECK (((tipo)::text = ANY ((ARRAY['ingreso'::character varying, 'gasto'::character varying])::text[])))
- pagos.pagos_estado_valido (c): CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'pagado'::character varying])::text[])))
- pagos.pagos_monto_positivo (c): CHECK ((monto > 0))
- pagos.pagos_nombre_minimo (c): CHECK ((char_length(btrim((nombre)::text)) >= 2))
- pagos.pagos_pkey (p): PRIMARY KEY (id)
Índices únicos:
- categorias.categorias_pkey: CREATE UNIQUE INDEX categorias_pkey ON public.categorias USING btree (id)
- categorias.ux_categorias_nombre: CREATE UNIQUE INDEX ux_categorias_nombre ON public.categorias USING btree (lower(btrim((nombre)::text)))
- eventos_presupuesto.eventos_presupuesto_pkey: CREATE UNIQUE INDEX eventos_presupuesto_pkey ON public.eventos_presupuesto USING btree (id)
- miembros.miembros_pkey: CREATE UNIQUE INDEX miembros_pkey ON public.miembros USING btree (id)
- miembros.ux_miembros_nombre: CREATE UNIQUE INDEX ux_miembros_nombre ON public.miembros USING btree (lower(btrim((nombre)::text)))
- movimientos.movimientos_pkey: CREATE UNIQUE INDEX movimientos_pkey ON public.movimientos USING btree (id)
- pagos.pagos_pkey: CREATE UNIQUE INDEX pagos_pkey ON public.pagos USING btree (id)
RLS:
- miembros: activo
- categorias: activo
- pagos: activo
- movimientos: activo
- eventos_presupuesto: activo
OK a) inserciones válidas de miembro, categoría y pago
OK b) monto cero rechazado (RN-01): SQLSTATE 23514 (movimientos_monto_positivo)
OK c) transferencia rechazada (RN-02): literal 'transferencia': 22001; 'transfer' alcanza el CHECK: 23514 (movimientos_tipo_valido)
OK d) hormiga en ingreso rechazada (RN-03): SQLSTATE 23514 (movimientos_hormiga_solo_gasto)
OK e) pago vinculado a ingreso rechazado (RN-03): SQLSTATE 23514 (movimientos_pago_solo_gasto)
OK f) monto negativo de pago rechazado: SQLSTATE 23514 (pagos_monto_positivo)
OK g) miembro duplicado sin distinción de mayúsculas rechazado: SQLSTATE 23505 (ux_miembros_nombre)
OK h) abono de 120000 y restante de 80000 en v_pagos
Transacción de pruebas: ROLLBACK
Total de fallas: 0
```

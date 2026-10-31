import { conectarBaseDatos } from "./conexion-bd.mjs";

const tablas = [
  "miembros",
  "categorias",
  "pagos",
  "movimientos",
  "eventos_presupuesto",
  "v_pagos",
];
const tablasConRls = tablas.slice(0, 5);
const resultadosCasos = [];

function registrarCaso(nombre, correcto, detalle = "") {
  resultadosCasos.push(correcto);
  console.log(`${correcto ? "OK" : "FALLA"} ${nombre}${detalle ? `: ${detalle}` : ""}`);
}

async function obtenerErrorDeInsercion(cliente, punto, sql, valores) {
  await cliente.query(`SAVEPOINT ${punto}`);
  let errorDeInsercion;
  try {
    await cliente.query(sql, valores);
  } catch (error) {
    errorDeInsercion = error;
  }
  await cliente.query(`ROLLBACK TO SAVEPOINT ${punto}`);
  await cliente.query(`RELEASE SAVEPOINT ${punto}`);
  return errorDeInsercion;
}

async function casoQueDebeFallar(
  cliente,
  nombre,
  punto,
  sql,
  valores,
  codigoEsperado,
  restriccionEsperada,
) {
  const error = await obtenerErrorDeInsercion(cliente, punto, sql, valores);
  const correcto =
    Boolean(error) &&
    error.code === codigoEsperado &&
    (!restriccionEsperada || error.constraint === restriccionEsperada);
  registrarCaso(
    nombre,
    correcto,
    correcto
      ? `SQLSTATE ${error.code}${error.constraint ? ` (${error.constraint})` : ""}`
      : error
        ? `se esperaba ${codigoEsperado}${restriccionEsperada ? ` (${restriccionEsperada})` : ""}, se obtuvo ${error.code ?? error.message}${error.constraint ? ` (${error.constraint})` : ""}`
        : "la inserción no fue rechazada",
  );
}

async function informarEstructura(cliente) {
  const existentes = await cliente.query(
    `SELECT nombre, to_regclass(format('%I.%I', 'public', nombre)) IS NOT NULL AS existe
     FROM unnest($1::text[]) AS nombre`,
    [tablas],
  );
  const mapaExistencia = new Map(
    existentes.rows.map((fila) => [fila.nombre, fila.existe]),
  );

  console.log("Existencia:");
  for (const tabla of tablas) {
    console.log(`- ${tabla}: ${mapaExistencia.get(tabla) ? "sí" : "no"}`);
  }

  console.log("Filas:");
  for (const tabla of tablas.slice(0, 5)) {
    if (!mapaExistencia.get(tabla)) {
      console.log(`- ${tabla}: no disponible (tabla inexistente)`);
      continue;
    }
    const resultado = await cliente.query(
      `SELECT count(*)::bigint AS cantidad FROM public.${tabla}`,
    );
    console.log(`- ${tabla}: ${resultado.rows[0].cantidad}`);
  }

  console.log("Restricciones de movimientos y pagos:");
  const restricciones = await cliente.query(`
    SELECT t.relname AS tabla, c.conname AS restriccion, c.contype AS tipo,
           pg_get_constraintdef(c.oid) AS definicion
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND t.relname IN ('movimientos', 'pagos')
    ORDER BY t.relname, c.conname
  `);
  for (const fila of restricciones.rows) {
    console.log(`- ${fila.tabla}.${fila.restriccion} (${fila.tipo}): ${fila.definicion}`);
  }
  if (restricciones.rowCount === 0) {
    console.log("- ninguna");
  }

  console.log("Índices únicos:");
  const indices = await cliente.query(`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = ANY($1::text[])
      AND indexdef ILIKE 'CREATE UNIQUE INDEX%'
    ORDER BY tablename, indexname
  `, [tablasConRls]);
  for (const fila of indices.rows) {
    console.log(`- ${fila.tablename}.${fila.indexname}: ${fila.indexdef}`);
  }
  if (indices.rowCount === 0) {
    console.log("- ninguno");
  }

  console.log("RLS:");
  const rls = await cliente.query(`
    SELECT nombre, COALESCE(c.relrowsecurity, false) AS activo
    FROM unnest($1::text[]) AS nombre
    LEFT JOIN pg_namespace n ON n.nspname = 'public'
    LEFT JOIN pg_class c ON c.relnamespace = n.oid AND c.relname = nombre
  `, [tablasConRls]);
  for (const fila of rls.rows) {
    console.log(`- ${fila.nombre}: ${fila.activo ? "activo" : "inactivo"}`);
  }
}

async function ejecutarPruebas(cliente) {
  let miembroId;
  let categoriaId;
  let pagoId;
  let transaccionIniciada = false;

  try {
    await cliente.query("BEGIN");
    transaccionIniciada = true;

    try {
      const miembro = await cliente.query(
        "INSERT INTO miembros (nombre) VALUES ($1) RETURNING id",
        ["Verif"],
      );
      miembroId = miembro.rows[0].id;
      const categoria = await cliente.query(
        "INSERT INTO categorias (nombre, limite_mensual) VALUES ($1, $2) RETURNING id",
        ["Verif Cat", 100000],
      );
      categoriaId = categoria.rows[0].id;
      const pago = await cliente.query(
        `INSERT INTO pagos (nombre, monto, fecha_limite, estado)
         VALUES ($1, $2, CURRENT_DATE + 1, 'pendiente') RETURNING id`,
        ["Verif Pago", 200000],
      );
      pagoId = pago.rows[0].id;
      registrarCaso("a) inserciones válidas de miembro, categoría y pago", true);
    } catch (error) {
      registrarCaso("a) inserciones válidas de miembro, categoría y pago", false, error.code ?? error.message);
    }

    if (miembroId && categoriaId && pagoId) {
      await casoQueDebeFallar(
        cliente,
        "b) monto cero rechazado (RN-01)",
        "verif_b",
        "INSERT INTO movimientos (miembro_id, categoria_id, tipo, monto, fecha) VALUES ($1, $2, $3, 0, CURRENT_DATE)",
        [miembroId, categoriaId, "gasto"],
        "23514",
        "movimientos_monto_positivo",
      );
      const errorTipoLargo = await obtenerErrorDeInsercion(
        cliente,
        "verif_c_literal",
        "INSERT INTO movimientos (miembro_id, categoria_id, tipo, monto, fecha) VALUES ($1, $2, 'transferencia', 1, CURRENT_DATE)",
        [miembroId, categoriaId],
      );
      const errorTipoFueraDeDominio = await obtenerErrorDeInsercion(
        cliente,
        "verif_c_check",
        "INSERT INTO movimientos (miembro_id, categoria_id, tipo, monto, fecha) VALUES ($1, $2, 'transfer', 1, CURRENT_DATE)",
        [miembroId, categoriaId],
      );
      registrarCaso(
        "c) transferencia rechazada (RN-02)",
        errorTipoLargo?.code === "22001" &&
          errorTipoFueraDeDominio?.code === "23514" &&
          errorTipoFueraDeDominio.constraint === "movimientos_tipo_valido",
        `literal 'transferencia': ${errorTipoLargo?.code ?? "permitida"}; 'transfer' alcanza el CHECK: ${errorTipoFueraDeDominio?.code ?? "permitido"}${errorTipoFueraDeDominio?.constraint ? ` (${errorTipoFueraDeDominio.constraint})` : ""}`,
      );
      await casoQueDebeFallar(
        cliente,
        "d) hormiga en ingreso rechazada (RN-03)",
        "verif_d",
        "INSERT INTO movimientos (miembro_id, categoria_id, tipo, monto, fecha, es_hormiga) VALUES ($1, $2, 'ingreso', 1, CURRENT_DATE, true)",
        [miembroId, categoriaId],
        "23514",
        "movimientos_hormiga_solo_gasto",
      );
      await casoQueDebeFallar(
        cliente,
        "e) pago vinculado a ingreso rechazado (RN-03)",
        "verif_e",
        "INSERT INTO movimientos (miembro_id, categoria_id, tipo, monto, fecha, pago_pendiente_id) VALUES ($1, $2, 'ingreso', 1, CURRENT_DATE, $3)",
        [miembroId, categoriaId, pagoId],
        "23514",
        "movimientos_pago_solo_gasto",
      );
      await casoQueDebeFallar(
        cliente,
        "f) monto negativo de pago rechazado",
        "verif_f",
        "INSERT INTO pagos (nombre, monto, fecha_limite) VALUES ('Verif Pago Negativo', -1, CURRENT_DATE + 1)",
        [],
        "23514",
        "pagos_monto_positivo",
      );
      await casoQueDebeFallar(
        cliente,
        "g) miembro duplicado sin distinción de mayúsculas rechazado",
        "verif_g",
        "INSERT INTO miembros (nombre) VALUES ('verif')",
        [],
        "23505",
        "ux_miembros_nombre",
      );

      try {
        const movimiento = await cliente.query(
          `INSERT INTO movimientos
             (miembro_id, categoria_id, tipo, monto, fecha, pago_pendiente_id)
           VALUES ($1, $2, 'gasto', 120000, CURRENT_DATE, $3)`,
          [miembroId, categoriaId, pagoId],
        );
        const pago = await cliente.query(
          "SELECT abonado, restante FROM v_pagos WHERE id = $1",
          [pagoId],
        );
        const correcto =
          movimiento.rowCount === 1 &&
          pago.rowCount === 1 &&
          Number(pago.rows[0].abonado) === 120000 &&
          Number(pago.rows[0].restante) === 80000;
        registrarCaso(
          "h) abono de 120000 y restante de 80000 en v_pagos",
          correcto,
          correcto
            ? ""
            : `abonado=${pago.rows[0]?.abonado ?? "sin fila"}, restante=${pago.rows[0]?.restante ?? "sin fila"}`,
        );
      } catch (error) {
        registrarCaso("h) abono de 120000 y restante de 80000 en v_pagos", false, error.code ?? error.message);
      }
    } else {
      for (const [caso, nombre] of [
        ["b", "monto cero rechazado (RN-01)"],
        ["c", "tipo transferencia rechazado (RN-02)"],
        ["d", "hormiga en ingreso rechazada (RN-03)"],
        ["e", "pago vinculado a ingreso rechazado (RN-03)"],
        ["f", "monto negativo de pago rechazado"],
        ["g", "miembro duplicado sin distinción de mayúsculas rechazado"],
        ["h", "abono y restante correctos en v_pagos"],
      ]) {
        registrarCaso(`${caso}) ${nombre}`, false, "no se pudieron crear los datos de preparación");
      }
    }
  } finally {
    if (transaccionIniciada) {
      await cliente.query("ROLLBACK");
      console.log("Transacción de pruebas: ROLLBACK");
    }
  }
}

async function verificarBaseDatos() {
  const cliente = await conectarBaseDatos();
  try {
    await informarEstructura(cliente);
    await ejecutarPruebas(cliente);
    const fallas = resultadosCasos.filter((correcto) => !correcto).length;
    console.log(`Total de fallas: ${fallas}`);
    if (fallas > 0) {
      process.exitCode = 1;
    }
  } finally {
    await cliente.end();
  }
}

verificarBaseDatos().catch((error) => {
  console.error(`Falló la verificación: ${error.code ?? error.message}`);
  process.exitCode = 1;
});

import { conectarBaseDatos } from './conexion-bd.mjs';

function obtenerPatrones(argumentos) {
  const opcionesValidas = new Set(['--prueba', '--demo']);
  const desconocidas = argumentos.filter((argumento) => !opcionesValidas.has(argumento));
  if (desconocidas.length > 0) {
    throw new Error(`Opciones no reconocidas: ${desconocidas.join(', ')}`);
  }

  const seleccionadas = argumentos.length === 0 ? ['--prueba', '--demo'] : argumentos;
  return [...new Set(seleccionadas)].map((opcion) => (opcion === '--prueba' ? 'Prueba%' : 'Demo%'));
}

async function limpiar() {
  const patrones = obtenerPatrones(process.argv.slice(2));
  const cliente = await conectarBaseDatos();

  try {
    await cliente.query('BEGIN');
    const miembros = await cliente.query(
      'SELECT id FROM miembros WHERE nombre LIKE ANY($1::text[])',
      [patrones],
    );
    const pagos = await cliente.query('SELECT id FROM pagos WHERE nombre LIKE ANY($1::text[])', [
      patrones,
    ]);

    const idsMiembros = miembros.rows.map((fila) => fila.id);
    const idsPagos = pagos.rows.map((fila) => fila.id);
    const movimientos = await cliente.query(
      `SELECT id
       FROM movimientos
       WHERE miembro_id = ANY($1::uuid[])
          OR pago_pendiente_id = ANY($2::uuid[])`,
      [idsMiembros, idsPagos],
    );
    const idsMovimientos = movimientos.rows.map((fila) => String(fila.id));

    const eliminadosMovimientos = await cliente.query(
      'DELETE FROM movimientos WHERE id = ANY($1::bigint[])',
      [idsMovimientos],
    );
    const eliminadosEventos = await cliente.query(
      `DELETE FROM eventos_presupuesto
       WHERE detalle ->> 'movimientoId' = ANY($1::text[])`,
      [idsMovimientos],
    );
    const eliminadosPagos = await cliente.query(
      'DELETE FROM pagos WHERE nombre LIKE ANY($1::text[])',
      [patrones],
    );
    const eliminadasCategorias = await cliente.query(
      'DELETE FROM categorias WHERE nombre LIKE ANY($1::text[])',
      [patrones],
    );
    const eliminadosMiembros = await cliente.query(
      'DELETE FROM miembros WHERE nombre LIKE ANY($1::text[])',
      [patrones],
    );

    await cliente.query('COMMIT');
    console.table([
      { tabla: 'movimientos', eliminados: eliminadosMovimientos.rowCount },
      { tabla: 'eventos_presupuesto', eliminados: eliminadosEventos.rowCount },
      { tabla: 'pagos', eliminados: eliminadosPagos.rowCount },
      { tabla: 'categorias', eliminados: eliminadasCategorias.rowCount },
      { tabla: 'miembros', eliminados: eliminadosMiembros.rowCount },
    ]);
  } catch (error) {
    try {
      await cliente.query('ROLLBACK');
    } catch (errorRollback) {
      console.error('No se pudo revertir la limpieza de prueba.', errorRollback);
    }
    throw error;
  } finally {
    await cliente.end();
  }
}

limpiar().catch((error) => {
  console.error('No se pudieron limpiar los datos de prueba.', error);
  process.exitCode = 1;
});

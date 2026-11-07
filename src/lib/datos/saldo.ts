import { conTransaccion } from '@/lib/db/conexion';
import { conErroresDeDatos } from '@/lib/datos/errores';
import type { DesgloseSaldo } from '@/lib/datos/tipos';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { hoyBogota, inicioYFinDeMes } from '@/lib/reglas/fechas';
import type { Pool, PoolClient, QueryResultRow } from 'pg';

interface TotalesMes extends QueryResultRow {
  ingresos: number;
  gastos: number;
  pagosPendientesMes: number;
}

async function calcularSaldoEnCliente(cliente: Pool | PoolClient): Promise<DesgloseSaldo> {
  const { inicio, fin } = inicioYFinDeMes(hoyBogota());

  await cliente.query(
    `SELECT id
     FROM pagos
     WHERE estado = 'pendiente' AND fecha_limite BETWEEN $1 AND $2
     FOR UPDATE`,
    [inicio, fin],
  );

  const resultado = await cliente.query<TotalesMes>(
    `WITH movimientos_mes AS (
       SELECT
         COALESCE(SUM(monto) FILTER (WHERE tipo = 'ingreso'), 0)::bigint AS ingresos,
         COALESCE(SUM(monto) FILTER (WHERE tipo = 'gasto'), 0)::bigint AS gastos
       FROM movimientos
       WHERE fecha BETWEEN $1 AND $2
     ),
     pagos_mes AS (
       SELECT COALESCE(
         SUM(GREATEST(p.monto - COALESCE(abonos.total, 0), 0)),
         0
       )::bigint AS pagos_pendientes_mes
       FROM pagos p
       LEFT JOIN (
         SELECT pago_pendiente_id, SUM(monto)::bigint AS total
         FROM movimientos
         WHERE pago_pendiente_id IS NOT NULL
         GROUP BY pago_pendiente_id
       ) abonos ON abonos.pago_pendiente_id = p.id
       WHERE p.estado = 'pendiente' AND p.fecha_limite BETWEEN $1 AND $2
     )
     SELECT movimientos_mes.ingresos, movimientos_mes.gastos,
            pagos_mes.pagos_pendientes_mes AS "pagosPendientesMes"
     FROM movimientos_mes CROSS JOIN pagos_mes`,
    [inicio, fin],
  );
  const totales = resultado.rows[0]!;
  return {
    ingresos: totales.ingresos,
    gastos: totales.gastos,
    pagosPendientesMes: totales.pagosPendientesMes,
    saldo: totales.ingresos - totales.gastos - totales.pagosPendientesMes,
  };
}

export async function calcularSaldo(cliente?: PoolClient): Promise<DesgloseSaldo> {
  return conErroresDeDatos(async () => {
    if (cliente) {
      return calcularSaldoEnCliente(cliente);
    }
    return conTransaccion((tx) => calcularSaldoEnCliente(tx));
  });
}

export async function calcularSaldoTrasGasto(tx: PoolClient, montoGasto: number): Promise<number> {
  if (!Number.isInteger(montoGasto) || montoGasto <= 0) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }
  const saldoActual = await calcularSaldo(tx);
  return saldoActual.saldo - montoGasto;
}

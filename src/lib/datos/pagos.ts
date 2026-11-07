import { z } from 'zod';
import { LIMITE_LISTADO } from '@/lib/config/presupuesto';
import { conTransaccion, pool } from '@/lib/db/conexion';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { diasRestantes, esFechaFutura, hoyBogota } from '@/lib/reglas/fechas';
import { ORDEN_URGENCIA, nivelUrgencia } from '@/lib/reglas/urgencia';
import { estadoTrasAbono } from '@/lib/reglas/vinculacion';
import { esquemaPago } from '@/lib/validacion/esquemas';
import { conErroresDeDatos } from '@/lib/datos/errores';
import type { EstadoPago, FilaAlerta, FilaPago } from '@/lib/datos/tipos';
import type { PoolClient, QueryResultRow } from 'pg';

const esquemaId = z.uuid();

interface FilaPagoBloqueado extends QueryResultRow {
  id: string;
  nombre: string;
  monto: number;
  fechaLimite: string;
  abonable: boolean;
  estado: EstadoPago;
}

export async function listarPagos(filtros: { estado?: EstadoPago } = {}): Promise<FilaPago[]> {
  return conErroresDeDatos(async () => {
    if (
      filtros.estado !== undefined &&
      filtros.estado !== 'pendiente' &&
      filtros.estado !== 'pagado'
    ) {
      throw new ErrorDeNegocio('DATOS_INVALIDOS');
    }

    const resultado = await pool.query<FilaPago>(
      `SELECT id, nombre, monto, fecha_limite AS "fechaLimite", recurrente, abonable, estado,
              abonado, restante, created_at::text AS "createdAt",
              updated_at::text AS "updatedAt"
       FROM v_pagos
       WHERE $1::varchar IS NULL OR estado = $1
       ORDER BY fecha_limite, nombre
       LIMIT $2`,
      [filtros.estado ?? null, LIMITE_LISTADO],
    );
    return resultado.rows;
  });
}

export async function crearPago(datosEntrada: {
  nombre: string;
  monto: number;
  fechaLimite: string;
  recurrente: boolean;
  abonable: boolean;
}): Promise<{ id: string }> {
  return conErroresDeDatos(async () => {
    const datos = esquemaPago.parse({
      ...datosEntrada,
      nombre: datosEntrada.nombre.trim(),
    });

    if (!esFechaFutura(datos.fechaLimite, hoyBogota())) {
      throw new ErrorDeNegocio('FECHA_NO_FUTURA');
    }

    const resultado = await pool.query<{ id: string }>(
      `INSERT INTO pagos (nombre, monto, fecha_limite, recurrente, abonable)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [datos.nombre, datos.monto, datos.fechaLimite, datos.recurrente, datos.abonable],
    );
    return resultado.rows[0]!;
  });
}

export async function eliminarPago(id: string): Promise<void> {
  return conErroresDeDatos(() =>
    conTransaccion(async (tx) => {
      const idValidado = esquemaId.parse(id);
      const pago = await tx.query<{ estado: EstadoPago }>(
        'SELECT estado FROM pagos WHERE id = $1 FOR UPDATE',
        [idValidado],
      );
      if (pago.rowCount === 0 || pago.rows[0]?.estado !== 'pendiente') {
        throw new ErrorDeNegocio('PAGO_NO_ELIMINABLE');
      }

      const movimientos = await tx.query<{ existe: boolean }>(
        `SELECT EXISTS (
           SELECT 1 FROM movimientos WHERE pago_pendiente_id = $1
         ) AS existe`,
        [idValidado],
      );
      if (movimientos.rows[0]?.existe) {
        throw new ErrorDeNegocio('PAGO_NO_ELIMINABLE');
      }

      await tx.query('DELETE FROM pagos WHERE id = $1', [idValidado]);
    }),
  );
}

export async function obtenerAlertasVencimiento(): Promise<FilaAlerta[]> {
  return conErroresDeDatos(async () => {
    const hoy = hoyBogota();
    const resultado = await pool.query<FilaPago>(
      `SELECT id, nombre, monto, fecha_limite AS "fechaLimite", recurrente, abonable, estado,
              abonado, restante, created_at::text AS "createdAt",
              updated_at::text AS "updatedAt"
       FROM v_pagos
       WHERE estado = 'pendiente'
       ORDER BY fecha_limite, nombre`,
    );

    return resultado.rows
      .map((pago) => {
        const dias = diasRestantes(pago.fechaLimite, hoy);
        return { ...pago, diasRestantes: dias, nivelUrgencia: nivelUrgencia(dias) };
      })
      .sort(
        (a, b) =>
          ORDEN_URGENCIA[a.nivelUrgencia] - ORDEN_URGENCIA[b.nivelUrgencia] ||
          a.fechaLimite.localeCompare(b.fechaLimite) ||
          a.nombre.localeCompare(b.nombre),
      );
  });
}

export async function bloquearPago(tx: PoolClient, id: string): Promise<FilaPagoBloqueado> {
  const resultado = await tx.query<FilaPagoBloqueado>(
    `SELECT id, nombre, monto, fecha_limite AS "fechaLimite", abonable, estado
     FROM pagos
     WHERE id = $1
     FOR UPDATE`,
    [id],
  );
  const pago = resultado.rows[0];
  if (!pago) {
    throw new ErrorDeNegocio('PAGO_NO_ENCONTRADO');
  }
  return pago;
}

export async function sumarAbonos(tx: PoolClient, pagoId: string): Promise<number> {
  const resultado = await tx.query<{ abonado: number }>(
    `SELECT COALESCE(SUM(monto), 0)::bigint AS abonado
     FROM movimientos
     WHERE pago_pendiente_id = $1`,
    [pagoId],
  );
  return resultado.rows[0]!.abonado;
}

export async function recalcularEstadoPago(tx: PoolClient, pagoId: string): Promise<EstadoPago> {
  const pago = await bloquearPago(tx, pagoId);
  const abonado = await sumarAbonos(tx, pagoId);
  const estado = estadoTrasAbono(abonado, pago.monto);
  const resultado = await tx.query<{ estado: EstadoPago }>(
    'UPDATE pagos SET estado = $2 WHERE id = $1 RETURNING estado',
    [pagoId, estado],
  );
  const estadoActualizado = resultado.rows[0]?.estado;
  if (!estadoActualizado) {
    throw new ErrorDeNegocio('PAGO_NO_ENCONTRADO');
  }
  return estadoActualizado;
}

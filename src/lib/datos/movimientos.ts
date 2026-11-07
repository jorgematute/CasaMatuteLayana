import { z } from 'zod';
import { conTransaccion, pool } from '@/lib/db/conexion';
import { conErroresDeDatos } from '@/lib/datos/errores';
import { verificarCategoriaActiva, verificarMiembroActivo } from '@/lib/datos/catalogos';
import { registrarEvento } from '@/lib/datos/eventos';
import { bloquearPago, recalcularEstadoPago, sumarAbonos } from '@/lib/datos/pagos';
import { calcularSaldo, calcularSaldoTrasGasto } from '@/lib/datos/saldo';
import type {
  EstadoPago,
  FilaMovimiento,
  DatosMovimiento,
  ResultadoMovimiento,
} from '@/lib/datos/tipos';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { hoyBogota, inicioYFinDeMes } from '@/lib/reglas/fechas';
import { LIMITE_LISTADO } from '@/lib/config/presupuesto';
import { validarMovimiento } from '@/lib/reglas/movimiento';
import { resolverMontoVinculado, validarVinculacion } from '@/lib/reglas/vinculacion';
import { esquemaFiltrosMovimientos, esquemaMovimiento } from '@/lib/validacion/esquemas';
import type { PoolClient, QueryResultRow } from 'pg';

const esquemaId = z.uuid();

interface FilaId extends QueryResultRow {
  id: number;
}

async function insertarMovimiento(
  tx: PoolClient,
  datos: {
    miembroId: string;
    categoriaId: string;
    tipo: 'ingreso' | 'gasto';
    monto: number;
    fecha: string;
    esHormiga: boolean;
    pagoPendienteId: string | null;
  },
): Promise<FilaMovimiento> {
  const insertado = await tx.query<FilaId>(
    `INSERT INTO movimientos
       (miembro_id, categoria_id, tipo, monto, fecha, es_hormiga, pago_pendiente_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      datos.miembroId,
      datos.categoriaId,
      datos.tipo,
      datos.monto,
      datos.fecha,
      datos.esHormiga,
      datos.pagoPendienteId,
    ],
  );
  const id = insertado.rows[0]!.id;
  const resultado = await tx.query<FilaMovimiento>(
    `SELECT m.id, m.miembro_id AS "miembroId", m.categoria_id AS "categoriaId",
            m.tipo, m.monto, m.fecha, m.es_hormiga AS "esHormiga",
            m.pago_pendiente_id AS "pagoPendienteId", mi.nombre AS "miembroNombre",
            ca.nombre AS "categoriaNombre", pa.nombre AS "pagoNombre",
            m.created_at::text AS "createdAt"
     FROM movimientos m
     JOIN miembros mi ON mi.id = m.miembro_id
     JOIN categorias ca ON ca.id = m.categoria_id
     LEFT JOIN pagos pa ON pa.id = m.pago_pendiente_id
     WHERE m.id = $1`,
    [id],
  );
  return resultado.rows[0]!;
}

export async function registrarMovimiento(
  datosEntrada: DatosMovimiento,
  miembroSesion: string,
): Promise<ResultadoMovimiento> {
  return conErroresDeDatos(async () => {
    const datosRegla = {
      tipo: datosEntrada.tipo,
      monto: datosEntrada.monto,
      fecha: datosEntrada.fecha,
      esHormiga: datosEntrada.esHormiga ?? false,
      pagoPendienteId: datosEntrada.pagoPendienteId ?? null,
    };
    validarMovimiento(datosRegla);

    const datosValidados = esquemaMovimiento.parse({
      miembroId: datosEntrada.miembroId,
      categoriaId: datosEntrada.categoriaId,
      tipo: datosEntrada.tipo,
      monto: datosEntrada.monto,
      fecha: datosEntrada.fecha,
      esHormiga: datosRegla.esHormiga,
      ...(datosRegla.pagoPendienteId === null
        ? {}
        : { pagoPendienteId: datosRegla.pagoPendienteId }),
    });

    return conTransaccion(async (tx) => {
      await verificarMiembroActivo(tx, datosValidados.miembroId);
      await verificarCategoriaActiva(tx, datosValidados.categoriaId);
      // Serializa movimientos para que el saldo y los pagos no cambien entre validación e inserción.
      await tx.query('LOCK TABLE movimientos IN SHARE ROW EXCLUSIVE MODE');

      let pago: Awaited<ReturnType<typeof bloquearPago>> | null = null;
      let restantePago = 0;
      let montoFinal = datosValidados.monto;
      if (datosValidados.tipo === 'gasto' && datosValidados.pagoPendienteId) {
        pago = await bloquearPago(tx, datosValidados.pagoPendienteId);
        if (pago.estado === 'pagado') {
          throw new ErrorDeNegocio('PAGO_YA_PAGADO');
        }
        restantePago = pago.monto - (await sumarAbonos(tx, pago.id));
        if (restantePago <= 0) {
          throw new ErrorDeNegocio('PAGO_YA_PAGADO');
        }
        validarVinculacion({
          abonable: pago.abonable,
          montoEnviado: datosValidados.monto,
          restante: restantePago,
        });
        montoFinal = resolverMontoVinculado({
          abonable: pago.abonable,
          montoEnviado: datosValidados.monto,
          restante: restantePago,
        });
      }

      if (datosValidados.tipo === 'gasto') {
        let saldoTras = await calcularSaldoTrasGasto(tx, montoFinal);
        let compensacionPago = 0;

        if (pago) {
          const { inicio, fin } = inicioYFinDeMes(hoyBogota());
          if (pago.fechaLimite >= inicio && pago.fechaLimite <= fin) {
            compensacionPago = Math.min(montoFinal, restantePago);
            saldoTras += compensacionPago;
          }
        }

        if (saldoTras < 0) {
          throw new ErrorDeNegocio('SALDO_INSUFICIENTE', undefined, {
            saldoDisponible: saldoTras + montoFinal - compensacionPago,
          });
        }
      }

      const movimiento = await insertarMovimiento(tx, {
        miembroId: datosValidados.miembroId,
        categoriaId: datosValidados.categoriaId,
        tipo: datosValidados.tipo,
        monto: montoFinal,
        fecha: datosValidados.fecha,
        esHormiga: datosValidados.esHormiga ?? false,
        pagoPendienteId: datosValidados.pagoPendienteId ?? null,
      });

      let estadoPago: EstadoPago | null = pago?.estado ?? null;
      if (pago) {
        estadoPago = await recalcularEstadoPago(tx, pago.id);
      }

      await registrarEvento(tx, {
        tipo: 'MOVIMIENTO_REGISTRADO',
        detalle: {
          movimientoId: movimiento.id,
          tipo: movimiento.tipo,
          monto: movimiento.monto,
          miembroSesion,
        },
      });

      const saldo = await calcularSaldo(tx);
      return { movimiento, saldo, estadoPago };
    });
  });
}

export async function listarMovimientos(
  filtros: { miembroId?: string; categoriaId?: string; desde?: string; hasta?: string } = {},
): Promise<FilaMovimiento[]> {
  return conErroresDeDatos(async () => {
    const datos = esquemaFiltrosMovimientos.parse(filtros);
    const condiciones: string[] = [];
    const valores: unknown[] = [];
    const agregarFiltro = (columna: string, valor: string | undefined) => {
      if (valor !== undefined) {
        valores.push(valor);
        condiciones.push(`${columna} = $${valores.length}`);
      }
    };

    agregarFiltro('m.miembro_id', datos.miembroId);
    agregarFiltro('m.categoria_id', datos.categoriaId);
    if (datos.desde !== undefined) {
      valores.push(datos.desde);
      condiciones.push(`m.fecha >= $${valores.length}`);
    }
    if (datos.hasta !== undefined) {
      valores.push(datos.hasta);
      condiciones.push(`m.fecha <= $${valores.length}`);
    }

    valores.push(LIMITE_LISTADO);
    const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
    const resultado = await pool.query<FilaMovimiento>(
      `SELECT m.id, m.miembro_id AS "miembroId", m.categoria_id AS "categoriaId",
              m.tipo, m.monto, m.fecha, m.es_hormiga AS "esHormiga",
              m.pago_pendiente_id AS "pagoPendienteId", mi.nombre AS "miembroNombre",
              ca.nombre AS "categoriaNombre", pa.nombre AS "pagoNombre",
              m.created_at::text AS "createdAt"
       FROM movimientos m
       JOIN miembros mi ON mi.id = m.miembro_id
       JOIN categorias ca ON ca.id = m.categoria_id
       LEFT JOIN pagos pa ON pa.id = m.pago_pendiente_id
       ${where}
       ORDER BY m.fecha DESC, m.id DESC
       LIMIT $${valores.length}`,
      valores,
    );
    return resultado.rows;
  });
}

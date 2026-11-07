import { z } from 'zod';
import { pool } from '@/lib/db/conexion';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import {
  esquemaCategoria,
  esquemaCambiosCategoria,
  esquemaCambiosMiembro,
  esquemaMiembro,
} from '@/lib/validacion/esquemas';
import { conErroresDeDatos } from '@/lib/datos/errores';
import type { FilaCategoria, FilaMiembro } from '@/lib/datos/tipos';
import type { PoolClient } from 'pg';

const esquemaId = z.uuid();

export async function listarMiembros(
  filtros: { incluirInactivos?: boolean } = {},
): Promise<FilaMiembro[]> {
  return conErroresDeDatos(async () => {
    const resultado = await pool.query<FilaMiembro>(
      `SELECT m.id, m.nombre, m.activo,
              COUNT(mov.id)::bigint AS "totalMovimientos"
       FROM miembros m
       LEFT JOIN movimientos mov ON mov.miembro_id = m.id
       WHERE $1::boolean OR m.activo = true
       GROUP BY m.id
       ORDER BY m.nombre`,
      [filtros.incluirInactivos ?? false],
    );
    return resultado.rows;
  });
}

export async function crearMiembro(nombre: string): Promise<{ id: string }> {
  return conErroresDeDatos(async () => {
    const datos = esquemaMiembro.parse({ nombre: nombre.trim() });
    const resultado = await pool.query<{ id: string }>(
      `INSERT INTO miembros (nombre) VALUES ($1) RETURNING id`,
      [datos.nombre],
    );
    return resultado.rows[0]!;
  });
}

export async function actualizarMiembro(
  id: string,
  cambios: { nombre?: string; activo?: boolean },
): Promise<void> {
  return conErroresDeDatos(async () => {
    const idValidado = esquemaId.parse(id);
    const datos = esquemaCambiosMiembro.parse({
      ...cambios,
      ...(cambios.nombre === undefined ? {} : { nombre: cambios.nombre.trim() }),
    });
    const resultado = await pool.query(
      `UPDATE miembros
       SET nombre = CASE WHEN $2::boolean THEN $3::varchar ELSE nombre END,
           activo = CASE WHEN $4::boolean THEN $5::boolean ELSE activo END
       WHERE id = $1
       RETURNING id`,
      [
        idValidado,
        datos.nombre !== undefined,
        datos.nombre ?? null,
        datos.activo !== undefined,
        datos.activo ?? null,
      ],
    );

    if (resultado.rowCount === 0) {
      throw new ErrorDeNegocio('MIEMBRO_INVALIDO', 'No existe el miembro indicado.');
    }
  });
}

export async function listarCategorias(
  filtros: { incluirInactivos?: boolean } = {},
): Promise<FilaCategoria[]> {
  return conErroresDeDatos(async () => {
    const resultado = await pool.query<FilaCategoria>(
      `SELECT c.id, c.nombre, c.limite_mensual AS "limiteMensual", c.activo,
              COUNT(m.id)::bigint AS "totalMovimientos"
       FROM categorias c
       LEFT JOIN movimientos m ON m.categoria_id = c.id
       WHERE $1::boolean OR c.activo = true
       GROUP BY c.id
       ORDER BY c.nombre`,
      [filtros.incluirInactivos ?? false],
    );
    return resultado.rows;
  });
}

export async function crearCategoria(datosEntrada: {
  nombre: string;
  limiteMensual: number | null;
}): Promise<{ id: string }> {
  return conErroresDeDatos(async () => {
    const datos = esquemaCategoria.parse({
      ...datosEntrada,
      nombre: datosEntrada.nombre.trim(),
    });
    const resultado = await pool.query<{ id: string }>(
      `INSERT INTO categorias (nombre, limite_mensual)
       VALUES ($1, $2)
       RETURNING id`,
      [datos.nombre, datos.limiteMensual],
    );
    return resultado.rows[0]!;
  });
}

export async function actualizarCategoria(
  id: string,
  cambios: { nombre?: string; limiteMensual?: number | null; activo?: boolean },
): Promise<void> {
  return conErroresDeDatos(async () => {
    const idValidado = esquemaId.parse(id);
    const datos = esquemaCambiosCategoria.parse({
      ...cambios,
      ...(cambios.nombre === undefined ? {} : { nombre: cambios.nombre.trim() }),
    });
    const resultado = await pool.query(
      `UPDATE categorias
       SET nombre = CASE WHEN $2::boolean THEN $3::varchar ELSE nombre END,
           limite_mensual = CASE WHEN $4::boolean THEN $5::integer ELSE limite_mensual END,
           activo = CASE WHEN $6::boolean THEN $7::boolean ELSE activo END
       WHERE id = $1
       RETURNING id`,
      [
        idValidado,
        datos.nombre !== undefined,
        datos.nombre ?? null,
        datos.limiteMensual !== undefined,
        datos.limiteMensual ?? null,
        datos.activo !== undefined,
        datos.activo ?? null,
      ],
    );

    if (resultado.rowCount === 0) {
      throw new ErrorDeNegocio('CATEGORIA_INVALIDA', 'No existe la categoría indicada.');
    }
  });
}

export async function verificarMiembroActivo(tx: PoolClient, id: string): Promise<void> {
  const resultado = await tx.query(
    'SELECT id FROM miembros WHERE id = $1 AND activo = true FOR SHARE',
    [id],
  );
  if (resultado.rowCount === 0) {
    throw new ErrorDeNegocio('MIEMBRO_INVALIDO');
  }
}

export async function verificarCategoriaActiva(tx: PoolClient, id: string): Promise<void> {
  const resultado = await tx.query(
    'SELECT id FROM categorias WHERE id = $1 AND activo = true FOR SHARE',
    [id],
  );
  if (resultado.rowCount === 0) {
    throw new ErrorDeNegocio('CATEGORIA_INVALIDA');
  }
}

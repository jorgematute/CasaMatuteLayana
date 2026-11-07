import type { PoolClient } from 'pg';

export async function registrarEvento(
  tx: PoolClient,
  evento: { tipo: string; detalle: Record<string, unknown> },
): Promise<void> {
  await tx.query(
    `INSERT INTO eventos_presupuesto (tipo, detalle)
     VALUES ($1, $2::jsonb)`,
    [evento.tipo, JSON.stringify(evento.detalle)],
  );
}

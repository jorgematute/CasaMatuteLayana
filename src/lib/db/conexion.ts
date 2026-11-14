import { Pool, types, type PoolClient, type QueryResultRow } from 'pg';

types.setTypeParser(1082, (valor) => valor);
types.setTypeParser(1114, (valor) => valor);
types.setTypeParser(20, (valor) => Number.parseInt(valor, 10));

const globalParaPool = globalThis as typeof globalThis & { poolCasaMatute?: Pool };

const cadenaConexion =
  process.env.CASAMATUTELAYANA_POSTGRES_URL_NON_POOLING ??
  process.env.CASAMATUTELAYANA_POSTGRES_URL;
const urlConexion = cadenaConexion ? new URL(cadenaConexion) : null;
urlConexion?.searchParams.delete('sslmode');
const certificadoPostgres = process.env.CASAMATUTELAYANA_POSTGRES_CA_CERT?.replace(/\\n/g, '\n');

export const pool =
  globalParaPool.poolCasaMatute ??
  new Pool({
    connectionString: urlConexion?.toString(),
    ssl: {
      rejectUnauthorized: true,
      ...(certificadoPostgres ? { ca: certificadoPostgres } : {}),
    },
    max: 3,
    idleTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalParaPool.poolCasaMatute = pool;
}

export async function consultar<T extends object = QueryResultRow>(
  sql: string,
  valores: unknown[] = [],
): Promise<T[]> {
  const resultado = await pool.query<T & QueryResultRow>(sql, valores);
  return resultado.rows;
}

export async function conTransaccion<T>(trabajo: (tx: PoolClient) => Promise<T>): Promise<T> {
  const tx = await pool.connect();

  try {
    await tx.query('BEGIN');
    const resultado = await trabajo(tx);
    await tx.query('COMMIT');
    return resultado;
  } catch (error) {
    try {
      await tx.query('ROLLBACK');
    } catch (errorRollback) {
      console.error('No se pudo revertir la transacción de Casa Matute.', errorRollback);
    }

    throw error;
  } finally {
    tx.release();
  }
}

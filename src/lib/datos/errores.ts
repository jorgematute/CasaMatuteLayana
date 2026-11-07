import { ZodError } from 'zod';
import { ErrorDeNegocio, type CodigoError } from '@/lib/reglas/errores';

interface ErrorPostgres {
  code: string;
  constraint?: string;
}

function esErrorPostgres(error: unknown): error is ErrorPostgres {
  return (
    typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
  );
}

function codigoPostgres(error: ErrorPostgres): CodigoError | null {
  if (error.code === '23505') {
    if (error.constraint === 'ux_miembros_nombre' || error.constraint === 'ux_categorias_nombre') {
      return 'NOMBRE_DUPLICADO';
    }

    return null;
  }

  if (error.code === '23503') return 'TIENE_MOVIMIENTOS';
  if (error.code === '23514') return 'DATOS_INVALIDOS';

  return null;
}

export async function conErroresDeDatos<T>(trabajo: () => Promise<T>): Promise<T> {
  try {
    return await trabajo();
  } catch (error) {
    if (error instanceof ErrorDeNegocio) {
      throw error;
    }

    if (error instanceof ZodError) {
      throw new ErrorDeNegocio('DATOS_INVALIDOS', undefined, error.flatten());
    }

    if (esErrorPostgres(error)) {
      const codigo = codigoPostgres(error);
      if (codigo) {
        throw new ErrorDeNegocio(codigo);
      }
    }

    console.error('Error interno en el acceso a datos de Casa Matute.', error);
    throw new ErrorDeNegocio('ERROR_INTERNO');
  }
}

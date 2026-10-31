import { z, ZodError } from 'zod';
import { ErrorDeNegocio, ESTADO_HTTP, MENSAJES, type CodigoError } from '@/lib/reglas/errores';

type ErrorPostgres = {
  code: string;
  constraint?: string;
};

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

function respuesta(cuerpo: Record<string, unknown>, estado: number): Response {
  return Response.json(cuerpo, {
    status: estado,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export function responderOk<T>(datos: T, estado = 200): Response {
  return respuesta({ ok: true, datos }, estado);
}

export function responderError(error: unknown): Response {
  if (error instanceof ErrorDeNegocio) {
    const errorRespuesta: {
      codigo: CodigoError;
      mensaje: string;
      detalles?: unknown;
    } = {
      codigo: error.codigo,
      mensaje: error.message,
    };

    if (error.detalles !== undefined) {
      errorRespuesta.detalles = error.detalles;
    }

    return respuesta({ ok: false, error: errorRespuesta }, ESTADO_HTTP[error.codigo]);
  }

  if (error instanceof ZodError) {
    return respuesta(
      {
        ok: false,
        error: {
          codigo: 'DATOS_INVALIDOS',
          mensaje: MENSAJES.DATOS_INVALIDOS,
          detalles: error.flatten(),
        },
      },
      ESTADO_HTTP.DATOS_INVALIDOS,
    );
  }

  if (esErrorPostgres(error)) {
    const codigo = codigoPostgres(error);

    if (codigo) {
      const errorTraducido = new ErrorDeNegocio(codigo);
      return respuesta(
        {
          ok: false,
          error: { codigo, mensaje: errorTraducido.message },
        },
        ESTADO_HTTP[codigo],
      );
    }
  }

  console.error('Error interno en la API de Casa Matute.', error);
  return respuesta(
    {
      ok: false,
      error: { codigo: 'ERROR_INTERNO', mensaje: MENSAJES.ERROR_INTERNO },
    },
    ESTADO_HTTP.ERROR_INTERNO,
  );
}

export function conManejoDeErrores<Argumentos extends unknown[]>(
  handler: (...argumentos: Argumentos) => Promise<Response>,
): (...argumentos: Argumentos) => Promise<Response> {
  return async (...argumentos) => {
    try {
      return await handler(...argumentos);
    } catch (error) {
      return responderError(error);
    }
  };
}

export async function leerCuerpo<Esquema extends z.ZodType>(
  request: Request,
  esquema: Esquema,
): Promise<z.infer<Esquema>> {
  let cuerpo: unknown;

  try {
    cuerpo = await request.json();
  } catch {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }

  return esquema.parse(cuerpo);
}

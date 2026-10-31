import { expect } from 'vitest';
import type { CodigoError } from '@/lib/reglas/errores';
import { ErrorDeNegocio } from '@/lib/reglas/errores';

export function esperarCodigo(fn: () => unknown, codigo: CodigoError): void {
  let error: unknown;
  try {
    fn();
  } catch (capturado) {
    error = capturado;
  }

  if (!(error instanceof ErrorDeNegocio)) {
    throw new Error(`Se esperaba ErrorDeNegocio con código ${codigo}.`);
  }
  expect(error.codigo).toBe(codigo);
}

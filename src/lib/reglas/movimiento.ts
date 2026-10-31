import { ErrorDeNegocio } from '@/lib/reglas/errores';

export type TipoMovimiento = 'ingreso' | 'gasto';

export function validarMovimiento(d: {
  tipo: TipoMovimiento;
  monto: number;
  fecha: string;
  esHormiga: boolean;
  pagoPendienteId: string | null;
}): void {
  if (!Number.isInteger(d.monto) || d.monto <= 0) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }

  if (d.tipo !== 'ingreso' && d.tipo !== 'gasto') {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }

  if (d.tipo === 'ingreso' && (d.esHormiga || d.pagoPendienteId !== null)) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }
}

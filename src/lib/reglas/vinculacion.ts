import { ErrorDeNegocio } from '@/lib/reglas/errores';

export function resolverMontoVinculado(d: {
  abonable: boolean;
  montoEnviado: number;
  restante: number;
}): number {
  return d.abonable ? d.montoEnviado : d.restante;
}

export function validarVinculacion(d: {
  abonable: boolean;
  montoEnviado: number;
  restante: number;
}): void {
  if (d.abonable && (!Number.isInteger(d.montoEnviado) || d.montoEnviado <= 0)) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }

  if (d.abonable && d.montoEnviado > d.restante) {
    throw new ErrorDeNegocio('MONTO_EXCEDE_RESTANTE');
  }
}

export function estadoTrasAbono(totalAbonado: number, montoPago: number): 'pendiente' | 'pagado' {
  return totalAbonado >= montoPago ? 'pagado' : 'pendiente';
}

import { describe, expect, it } from 'vitest';
import { validarMovimiento } from '@/lib/reglas/movimiento';
import { esperarCodigo } from './ayudas';

const movimientoBase = {
  tipo: 'gasto' as const,
  monto: 1500,
  fecha: '2030-06-15',
  esHormiga: false,
  pagoPendienteId: null,
};

describe('validarMovimiento', () => {
  it('T-01 rechaza monto cero', () => {
    esperarCodigo(() => validarMovimiento({ ...movimientoBase, monto: 0 }), 'DATOS_INVALIDOS');
  });

  it('T-02 rechaza monto negativo', () => {
    esperarCodigo(() => validarMovimiento({ ...movimientoBase, monto: -100 }), 'DATOS_INVALIDOS');
  });

  it('T-03 rechaza monto decimal', () => {
    esperarCodigo(() => validarMovimiento({ ...movimientoBase, monto: 1500.5 }), 'DATOS_INVALIDOS');
  });

  it('T-04 rechaza ingreso marcado como hormiga', () => {
    esperarCodigo(
      () => validarMovimiento({ ...movimientoBase, tipo: 'ingreso', esHormiga: true }),
      'DATOS_INVALIDOS',
    );
  });

  it('T-05 rechaza ingreso vinculado a un pago', () => {
    esperarCodigo(
      () => validarMovimiento({ ...movimientoBase, tipo: 'ingreso', pagoPendienteId: 'pago-1' }),
      'DATOS_INVALIDOS',
    );
  });

  it('T-06 acepta gasto válido con hormiga y pago', () => {
    expect(() => validarMovimiento({
      ...movimientoBase,
      esHormiga: true,
      pagoPendienteId: 'pago-1',
    })).not.toThrow();
  });
});

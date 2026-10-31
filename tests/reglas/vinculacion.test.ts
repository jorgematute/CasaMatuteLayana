import { describe, expect, it } from 'vitest';
import { estadoTrasAbono, resolverMontoVinculado, validarVinculacion } from '@/lib/reglas/vinculacion';
import { esperarCodigo } from './ayudas';

describe('vinculacion de movimientos y pagos', () => {
  it('T-17 usa el restante si el pago no es abonable', () => {
    expect(resolverMontoVinculado({
      abonable: false,
      montoEnviado: 999,
      restante: 300_000,
    })).toBe(300_000);
  });

  it('T-18 conserva el monto enviado si el pago es abonable', () => {
    expect(resolverMontoVinculado({
      abonable: true,
      montoEnviado: 150_000,
      restante: 300_000,
    })).toBe(150_000);
  });

  it('T-19 rechaza un abono abonable de cero', () => {
    esperarCodigo(
      () => validarVinculacion({ abonable: true, montoEnviado: 0, restante: 300_000 }),
      'DATOS_INVALIDOS',
    );
  });

  it('T-20 mantiene pendiente el pago si falta abonar', () => {
    expect(estadoTrasAbono(150_000, 300_000)).toBe('pendiente');
  });

  it('T-21 marca pagado cuando el total abonado iguala el monto', () => {
    expect(estadoTrasAbono(300_000, 300_000)).toBe('pagado');
  });

  it('T-22 marca pagado cuando el total abonado supera el monto', () => {
    expect(estadoTrasAbono(320_000, 300_000)).toBe('pagado');
  });

  it('no valida el monto enviado cuando el pago no es abonable', () => {
    expect(() => validarVinculacion({
      abonable: false,
      montoEnviado: 0,
      restante: 300_000,
    })).not.toThrow();
  });
});

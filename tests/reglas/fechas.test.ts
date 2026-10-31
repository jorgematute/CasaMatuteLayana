import { describe, expect, it } from 'vitest';
import { diasRestantes, esFechaFutura, esFechaValida, hoyBogota, inicioYFinDeMes } from '@/lib/reglas/fechas';

describe('reglas de fechas', () => {
  it('T-07 calcula días entre fechas', () => {
    expect(diasRestantes('2030-06-20', '2030-06-15')).toBe(5);
  });

  it('T-08 calcula cero días para la misma fecha', () => {
    expect(diasRestantes('2030-06-15', '2030-06-15')).toBe(0);
  });

  it('T-09 calcula días negativos para una fecha pasada', () => {
    expect(diasRestantes('2030-06-10', '2030-06-15')).toBe(-5);
  });

  it('T-23 reconoce una fecha futura', () => {
    expect(esFechaFutura('2030-06-16', '2030-06-15')).toBe(true);
  });

  it('T-24 considera que hoy no es una fecha futura', () => {
    expect(esFechaFutura('2030-06-15', '2030-06-15')).toBe(false);
  });

  it('T-25 devuelve el inicio y fin del mes', () => {
    expect(inicioYFinDeMes('2030-06-15')).toEqual({
      inicio: '2030-06-01',
      fin: '2030-06-30',
    });
  });

  it('valida fechas del calendario y rechaza fechas imposibles', () => {
    expect(esFechaValida('2030-02-28')).toBe(true);
    expect(esFechaValida('2030-02-29')).toBe(false);
    expect(esFechaValida('2030-2-01')).toBe(false);
  });

  it('calcula hoy en Bogotá con una fecha de referencia', () => {
    expect(hoyBogota(new Date('2030-06-15T04:30:00.000Z'))).toBe('2030-06-14');
  });
});

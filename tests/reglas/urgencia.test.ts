import { describe, expect, it } from 'vitest';
import { ETIQUETA_URGENCIA, nivelUrgencia, ORDEN_URGENCIA } from '@/lib/reglas/urgencia';

describe('nivelUrgencia', () => {
  it('T-10 clasifica 8 días como verde', () => {
    expect(nivelUrgencia(8)).toBe('verde');
  });

  it('T-11 clasifica 7 días como amarillo', () => {
    expect(nivelUrgencia(7)).toBe('amarillo');
  });

  it('T-12 clasifica 3 días como amarillo', () => {
    expect(nivelUrgencia(3)).toBe('amarillo');
  });

  it('T-13 clasifica 2 días como rojo', () => {
    expect(nivelUrgencia(2)).toBe('rojo');
  });

  it('T-14 clasifica el día del vencimiento como rojo', () => {
    expect(nivelUrgencia(0)).toBe('rojo');
  });

  it('T-15 clasifica una fecha pasada como vencido', () => {
    expect(nivelUrgencia(-1)).toBe('vencido');
  });

  it('T-16 clasifica 5 días como amarillo', () => {
    expect(nivelUrgencia(5)).toBe('amarillo');
  });

  it('expone el orden y las etiquetas de urgencia', () => {
    expect(ORDEN_URGENCIA).toEqual({ vencido: 0, rojo: 1, amarillo: 2, verde: 3 });
    expect(ETIQUETA_URGENCIA).toEqual({
      verde: 'Verde',
      amarillo: 'Amarillo',
      rojo: 'Rojo',
      vencido: 'Vencido',
    });
  });
});

import { describe, expect, it } from 'vitest';
import { nivelCategoria } from '@/lib/reglas/categoria';

describe('nivelCategoria', () => {
  it('T-26 mantiene normal el acumulado por debajo del 90 %', () => {
    expect(nivelCategoria(89_999, 100_000)).toBe('normal');
  });

  it('T-27 clasifica amarillo exactamente al 90 %', () => {
    expect(nivelCategoria(90_000, 100_000)).toBe('amarillo');
  });

  it('T-28 mantiene amarillo antes de alcanzar el límite', () => {
    expect(nivelCategoria(99_999, 100_000)).toBe('amarillo');
  });

  it('T-29 clasifica rojo al alcanzar el límite', () => {
    expect(nivelCategoria(100_000, 100_000)).toBe('rojo');
  });

  it('T-30 clasifica normal una categoría sin límite', () => {
    expect(nivelCategoria(50_000, null)).toBe('normal');
  });

  it('T-31 usa comparación entera al evaluar el 90 %', () => {
    expect(nivelCategoria(300, 333)).toBe('amarillo');
  });

  it('clasifica normal una categoría con límite cero', () => {
    expect(nivelCategoria(50_000, 0)).toBe('normal');
  });
});

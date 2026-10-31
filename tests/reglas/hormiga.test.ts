import { describe, expect, it } from 'vitest';
import { superaUmbralHormiga } from '@/lib/reglas/hormiga';

describe('superaUmbralHormiga', () => {
  it('T-32 no supera el umbral con 99.999 pesos', () => {
    expect(superaUmbralHormiga(99_999)).toBe(false);
  });

  it('T-33 alcanza el umbral con 100.000 pesos', () => {
    expect(superaUmbralHormiga(100_000)).toBe(true);
  });
});

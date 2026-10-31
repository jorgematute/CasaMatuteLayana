import { UMBRAL_HORMIGA } from '@/lib/config/presupuesto';

export function superaUmbralHormiga(acumulado: number): boolean {
  return acumulado >= UMBRAL_HORMIGA;
}

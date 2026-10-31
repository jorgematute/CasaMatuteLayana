import { PORCENTAJE_CATEGORIA_AMARILLO, PORCENTAJE_CATEGORIA_ROJO } from '@/lib/config/presupuesto';

export type NivelCategoria = 'normal' | 'amarillo' | 'rojo';

export function nivelCategoria(acumulado: number, limite: number | null): NivelCategoria {
  if (limite === null || limite === 0) {
    return 'normal';
  }
  if (acumulado >= limite) {
    return 'rojo';
  }
  if (acumulado * 100 >= PORCENTAJE_CATEGORIA_AMARILLO * limite) {
    return 'amarillo';
  }
  return 'normal';
}

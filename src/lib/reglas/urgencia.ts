import { DIAS_AMARILLO_MINIMO, DIAS_VERDE_MINIMO } from '@/lib/config/presupuesto';

export type NivelUrgencia = 'verde' | 'amarillo' | 'rojo' | 'vencido';

export function nivelUrgencia(diasRestantes: number): NivelUrgencia {
  if (diasRestantes < 0) {
    return 'vencido';
  }
  if (diasRestantes >= DIAS_VERDE_MINIMO) {
    return 'verde';
  }
  if (diasRestantes >= DIAS_AMARILLO_MINIMO) {
    return 'amarillo';
  }
  return 'rojo';
}

export const ORDEN_URGENCIA: Record<NivelUrgencia, number> = {
  vencido: 0,
  rojo: 1,
  amarillo: 2,
  verde: 3,
};

export const ETIQUETA_URGENCIA: Record<NivelUrgencia, string> = {
  verde: 'Verde',
  amarillo: 'Amarillo',
  rojo: 'Rojo',
  vencido: 'Vencido',
};

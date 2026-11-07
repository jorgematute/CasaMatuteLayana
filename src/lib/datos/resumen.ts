import type { FilaEstadoCategoria, ResumenAgrupado } from '@/lib/datos/tipos';

export async function obtenerEstadoCategorias(): Promise<FilaEstadoCategoria[]> {
  throw new Error('El estado de categorías estará disponible desde P09.');
}

export async function obtenerAcumuladoHormiga(): Promise<{ acumulado: number; supera: boolean }> {
  throw new Error('El acumulado de gastos hormiga estará disponible desde P10.');
}

export async function obtenerResumen(_filtros: {
  desde: string;
  hasta: string;
  miembroId?: string;
  categoriaId?: string;
}): Promise<ResumenAgrupado> {
  throw new Error('El resumen agrupado estará disponible desde P10.');
}

import type { Movimiento, Pago } from '@/lib/validacion/esquemas';
import type { NivelCategoria } from '@/lib/reglas/categoria';
import type { TipoMovimiento } from '@/lib/reglas/movimiento';
import type { NivelUrgencia } from '@/lib/reglas/urgencia';
import type { QueryResultRow } from 'pg';

export type EstadoPago = 'pendiente' | 'pagado';

export type DatosMovimiento = Omit<Movimiento, 'esHormiga' | 'pagoPendienteId'> & {
  esHormiga?: boolean;
  pagoPendienteId?: string | null;
};

export type DatosPago = Pago;

export interface FilaMiembro extends QueryResultRow {
  id: string;
  nombre: string;
  activo: boolean;
  totalMovimientos: number;
}

export interface FilaCategoria extends QueryResultRow {
  id: string;
  nombre: string;
  limiteMensual: number | null;
  activo: boolean;
  totalMovimientos: number;
}

export interface FilaPago extends QueryResultRow {
  id: string;
  nombre: string;
  monto: number;
  fechaLimite: string;
  recurrente: boolean;
  abonable: boolean;
  estado: EstadoPago;
  abonado: number;
  restante: number;
  createdAt: string;
  updatedAt: string;
}

export interface FilaMovimiento extends QueryResultRow {
  id: number;
  miembroId: string;
  categoriaId: string;
  tipo: TipoMovimiento;
  monto: number;
  fecha: string;
  esHormiga: boolean;
  pagoPendienteId: string | null;
  miembroNombre: string;
  categoriaNombre: string;
  pagoNombre: string | null;
  createdAt: string;
}

export interface FilaAlerta extends FilaPago {
  diasRestantes: number;
  nivelUrgencia: NivelUrgencia;
}

export interface DesgloseSaldo {
  ingresos: number;
  gastos: number;
  pagosPendientesMes: number;
  saldo: number;
}

export interface ResultadoMovimiento {
  movimiento: FilaMovimiento;
  saldo: DesgloseSaldo;
  estadoPago: EstadoPago | null;
}

export interface PanelHogar {
  alertas: FilaAlerta[];
  saldo: DesgloseSaldo;
}

export interface FilaEstadoCategoria extends FilaCategoria {
  acumulado: number;
  nivel: NivelCategoria;
}

export interface ResumenAgrupado {
  porMiembro: Array<{ miembroId: string; miembroNombre: string; ingresos: number; gastos: number }>;
  porCategoria: Array<{
    categoriaId: string;
    categoriaNombre: string;
    ingresos: number;
    gastos: number;
  }>;
  totalIngresos: number;
  totalGastos: number;
}

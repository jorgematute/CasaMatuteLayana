const formatoMoneda = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const formatoFecha = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

export function formatearPesos(monto: number): string {
  return formatoMoneda.format(monto);
}

export function formatearFecha(fecha: string): string {
  return formatoFecha.format(new Date(`${fecha}T00:00:00.000Z`));
}

export function formatearDiasRestantes(dias: number): string {
  if (dias === 0) return 'Vence hoy';
  if (dias > 0) return dias === 1 ? 'Falta 1 día' : `Faltan ${dias} días`;

  const diasVencidos = Math.abs(dias);
  return diasVencidos === 1 ? 'Venció hace 1 día' : `Venció hace ${diasVencidos} días`;
}

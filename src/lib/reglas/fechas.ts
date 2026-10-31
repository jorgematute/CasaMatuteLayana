import { ZONA_HORARIA } from '@/lib/config/presupuesto';

function componentesFecha(fecha: string): [number, number, number] | null {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!coincidencia) {
    return null;
  }

  return [Number(coincidencia[1]), Number(coincidencia[2]), Number(coincidencia[3])];
}

function milisegundosUtc(fecha: string): number {
  const componentes = componentesFecha(fecha);
  if (!componentes) {
    throw new RangeError(`Fecha inválida: ${fecha}`);
  }

  const [anio, mes, dia] = componentes;
  const bisiesto = anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0);
  const diasPorMes = [31, bisiesto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (mes < 1 || mes > 12 || dia < 1 || dia > (diasPorMes[mes - 1] ?? 0)) {
    throw new RangeError(`Fecha inválida: ${fecha}`);
  }

  if (anio >= 0 && anio <= 99) {
    return Date.UTC(anio + 400, mes - 1, dia) - 146_097 * 86_400_000;
  }

  return Date.UTC(anio, mes - 1, dia);
}

export function hoyBogota(reloj: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(reloj);
  const parte = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((item) => item.type === tipo)?.value;
  const anio = parte('year');
  const mes = parte('month');
  const dia = parte('day');

  if (!anio || !mes || !dia) {
    throw new Error('No fue posible obtener la fecha actual en Bogotá.');
  }

  return `${anio.padStart(4, '0')}-${mes}-${dia}`;
}

export function esFechaValida(fecha: string): boolean {
  try {
    milisegundosUtc(fecha);
    return true;
  } catch (error) {
    if (error instanceof RangeError) {
      return false;
    }
    throw error;
  }
}

export function esFechaFutura(fecha: string, hoy: string): boolean {
  return esFechaValida(fecha) && esFechaValida(hoy) && fecha > hoy;
}

export function diasRestantes(fechaLimite: string, hoy: string): number {
  return (milisegundosUtc(fechaLimite) - milisegundosUtc(hoy)) / 86_400_000;
}

export function inicioYFinDeMes(hoy: string): { inicio: string; fin: string } {
  if (!esFechaValida(hoy)) {
    throw new RangeError(`Fecha inválida: ${hoy}`);
  }

  const inicio = `${hoy.slice(0, 7)}-01`;
  const anio = Number(hoy.slice(0, 4));
  const mes = Number(hoy.slice(5, 7));
  const bisiesto = anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0);
  const diasPorMes = [31, bisiesto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const ultimoDia = diasPorMes[mes - 1];

  if (ultimoDia === undefined) {
    throw new RangeError(`Fecha inválida: ${hoy}`);
  }

  return { inicio, fin: `${hoy.slice(0, 7)}-${String(ultimoDia).padStart(2, '0')}` };
}

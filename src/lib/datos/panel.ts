import { obtenerAlertasVencimiento } from '@/lib/datos/pagos';
import { calcularSaldo } from '@/lib/datos/saldo';
import type { PanelHogar } from '@/lib/datos/tipos';

export async function obtenerPanel(): Promise<PanelHogar> {
  const [alertas, saldo] = await Promise.all([obtenerAlertasVencimiento(), calcularSaldo()]);
  return { alertas, saldo };
}

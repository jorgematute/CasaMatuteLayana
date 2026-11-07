import type { EstadoPago } from '@/lib/dataService';
import { Insignia } from '@/components/ui/Insignia';

export function InsigniaEstadoPago({ estado }: { estado: EstadoPago }) {
  return (
    <Insignia tono={estado === 'pagado' ? 'verde' : 'neutro'}>
      {estado === 'pagado' ? 'Pagado' : 'Pendiente'}
    </Insignia>
  );
}

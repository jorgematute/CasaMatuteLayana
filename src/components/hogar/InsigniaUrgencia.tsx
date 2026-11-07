import { ETIQUETA_URGENCIA, type NivelUrgencia } from '@/lib/reglas/urgencia';
import { Insignia } from '@/components/ui/Insignia';

const tonos: Record<NivelUrgencia, 'verde' | 'amarillo' | 'rojo'> = {
  verde: 'verde',
  amarillo: 'amarillo',
  rojo: 'rojo',
  vencido: 'rojo',
};

export function InsigniaUrgencia({ nivel }: { nivel: NivelUrgencia }) {
  return (
    <Insignia tono={tonos[nivel]} aria-label={`Urgencia: ${ETIQUETA_URGENCIA[nivel]}`}>
      {ETIQUETA_URGENCIA[nivel]}
    </Insignia>
  );
}

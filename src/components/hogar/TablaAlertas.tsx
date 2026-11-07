import { InsigniaUrgencia } from '@/components/hogar/InsigniaUrgencia';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import type { FilaAlerta } from '@/lib/dataService';
import { formatearDiasRestantes, formatearFecha, formatearPesos } from '@/lib/formato';

export function TablaAlertas({ alertas }: { alertas: FilaAlerta[] }) {
  if (alertas.length === 0) {
    return <EstadoVacio titulo="No hay pagos pendientes" />;
  }

  return (
    <div className="tabla-contenedor">
      <table className="tabla-catalogo tabla-alertas">
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">Restante</th>
            <th scope="col">Fecha límite</th>
            <th scope="col">Días restantes</th>
            <th scope="col">Urgencia</th>
          </tr>
        </thead>
        <tbody>
          {alertas.map((pago) => (
            <tr key={pago.id}>
              <th data-label="Nombre" scope="row">
                {pago.nombre}
              </th>
              <td data-label="Restante">{formatearPesos(pago.restante)}</td>
              <td data-label="Fecha límite">{formatearFecha(pago.fechaLimite)}</td>
              <td data-label="Días restantes">{formatearDiasRestantes(pago.diasRestantes)}</td>
              <td data-label="Urgencia">
                <InsigniaUrgencia nivel={pago.nivelUrgencia} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

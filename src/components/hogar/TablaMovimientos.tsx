import { Insignia } from '@/components/ui/Insignia';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import type { FilaMovimiento } from '@/lib/dataService';
import { formatearFecha, formatearPesos } from '@/lib/formato';

export function TablaMovimientos({ movimientos }: { movimientos: FilaMovimiento[] }) {
  if (movimientos.length === 0) {
    return <EstadoVacio titulo="No hay movimientos" />;
  }

  return (
    <div className="tabla-contenedor">
      <table className="tabla-catalogo tabla-movimientos">
        <thead>
          <tr>
            <th scope="col">Fecha</th>
            <th scope="col">Miembro</th>
            <th scope="col">Categoría</th>
            <th scope="col">Tipo</th>
            <th scope="col">Monto</th>
            <th scope="col">Gasto hormiga</th>
            <th scope="col">Pago vinculado</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.map((movimiento) => (
            <tr key={movimiento.id}>
              <td data-label="Fecha">{formatearFecha(movimiento.fecha)}</td>
              <th data-label="Miembro" scope="row">
                {movimiento.miembroNombre}
              </th>
              <td data-label="Categoría">{movimiento.categoriaNombre}</td>
              <td data-label="Tipo">
                <Insignia tono={movimiento.tipo}>
                  {movimiento.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
                </Insignia>
              </td>
              <td data-label="Monto">{formatearPesos(movimiento.monto)}</td>
              <td data-label="Gasto hormiga">{movimiento.esHormiga ? 'Sí' : 'No'}</td>
              <td data-label="Pago vinculado">{movimiento.pagoNombre ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

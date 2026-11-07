import Link from 'next/link';
import { TablaAlertas } from '@/components/hogar/TablaAlertas';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { formatearPesos } from '@/lib/formato';
import { obtenerPanel } from '@/lib/dataService';

export const dynamic = 'force-dynamic';

export default async function PanelHogarPage() {
  const panel = await obtenerPanel();

  return (
    <div className="hogar-panel">
      <header className="hogar-titulo">
        <p className="hogar-ceja">Presupuesto compartido</p>
        <h1>Panel del hogar</h1>
        <p>Un resumen claro de las cuentas y pagos próximos.</p>
      </header>

      <div className="hogar-panel__tarjetas">
        <Tarjeta titulo="Saldo del mes">
          <p className="hogar-monto">{formatearPesos(panel.saldo.saldo)}</p>
        </Tarjeta>

        <Tarjeta titulo="Alertas de vencimiento">
          <TablaAlertas alertas={panel.alertas} />
        </Tarjeta>
      </div>

      <div className="hogar-accesos">
        <Link className="boton boton--primario" href="/hogar/movimientos/nuevo">
          Registrar movimiento
        </Link>
        <Link className="boton boton--secundario" href="/hogar/pagos/nuevo">
          Registrar pago
        </Link>
        <Link className="boton boton--secundario" href="/hogar/catalogos">
          Gestionar miembros y categorías
        </Link>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { TablaPagos } from '@/components/hogar/TablaPagos';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { listarPagos } from '@/lib/dataService';

export const dynamic = 'force-dynamic';

export default async function PagosPage() {
  const pagos = await listarPagos();

  return (
    <div className="pagos">
      <header className="hogar-titulo">
        <p className="hogar-ceja">Obligaciones del hogar</p>
        <h1>Pagos</h1>
        <p>Consulta los montos, estados y fechas límite de las obligaciones registradas.</p>
      </header>

      <div className="pagos__encabezado">
        <h2>Pagos registrados</h2>
        <Link className="boton boton--primario" href="/hogar/pagos/nuevo">
          Registrar pago
        </Link>
      </div>

      <Tarjeta className="pagos__tarjeta">
        <TablaPagos pagos={pagos} />
      </Tarjeta>
    </div>
  );
}

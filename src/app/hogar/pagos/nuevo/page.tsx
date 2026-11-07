import Link from 'next/link';
import { FormularioPago } from '@/components/hogar/FormularioPago';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { hoyBogota } from '@/lib/reglas/fechas';

function mananaBogota(): string {
  const manana = new Date(`${hoyBogota()}T00:00:00.000Z`);
  manana.setUTCDate(manana.getUTCDate() + 1);
  return manana.toISOString().slice(0, 10);
}

export const dynamic = 'force-dynamic';

export default function NuevoPagoPage() {
  return (
    <div className="pagos">
      <header className="hogar-titulo">
        <p className="hogar-ceja">Obligaciones del hogar</p>
        <h1>Registrar pago</h1>
        <p>Agrega una obligación pendiente con su fecha límite y condiciones de pago.</p>
      </header>

      <Tarjeta className="pago-formulario-tarjeta">
        <FormularioPago fechaMinima={mananaBogota()} />
      </Tarjeta>

      <div className="hogar-accesos">
        <Link className="boton boton--secundario" href="/hogar/pagos">
          Volver a pagos
        </Link>
      </div>
    </div>
  );
}

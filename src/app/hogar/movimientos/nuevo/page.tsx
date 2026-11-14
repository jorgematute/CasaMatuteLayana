import Link from 'next/link';
import { FormularioMovimiento } from '@/components/hogar/FormularioMovimiento';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { calcularSaldo, listarCategorias, listarMiembros } from '@/lib/dataService';
import { hoyBogota } from '@/lib/reglas/fechas';

export const dynamic = 'force-dynamic';

export default async function NuevoMovimientoPage() {
  const [miembros, categorias, saldo] = await Promise.all([
    listarMiembros(),
    listarCategorias(),
    calcularSaldo(),
  ]);
  const fechaHoy = hoyBogota();

  return (
    <div className="movimientos">
      <header className="hogar-titulo">
        <p className="hogar-ceja">Actividad del hogar</p>
        <h1>Registrar movimiento</h1>
        <p>Registra un ingreso o un gasto para actualizar el presupuesto compartido.</p>
      </header>

      {miembros.length === 0 || categorias.length === 0 ? (
        <Tarjeta>
          <EstadoVacio
            accion={
              <Link className="boton boton--secundario" href="/hogar/catalogos">
                Gestionar catálogos
              </Link>
            }
            titulo="Completa los catálogos antes de registrar"
          >
            Necesitas al menos un miembro y una categoría activos.
          </EstadoVacio>
        </Tarjeta>
      ) : (
        <Tarjeta className="movimiento-formulario-tarjeta">
          <FormularioMovimiento
            categorias={categorias}
            fechaHoy={fechaHoy}
            miembros={miembros}
            saldo={saldo}
          />
        </Tarjeta>
      )}

      <div className="hogar-accesos">
        <Link className="boton boton--secundario" href="/hogar/movimientos">
          Volver a movimientos
        </Link>
      </div>
    </div>
  );
}

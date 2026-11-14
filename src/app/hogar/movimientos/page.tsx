import Link from 'next/link';
import { FiltrosMovimientos } from '@/components/hogar/FiltrosMovimientos';
import { TablaMovimientos } from '@/components/hogar/TablaMovimientos';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { listarCategorias, listarMiembros, listarMovimientos } from '@/lib/dataService';
import { esquemaFiltrosMovimientos } from '@/lib/validacion/esquemas';

type Parametros = { [key: string]: string | string[] | undefined };

export const dynamic = 'force-dynamic';

export default async function MovimientosPage({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  const parametros = await searchParams;
  const hayValoresDuplicados = Object.values(parametros).some(Array.isArray);
  const resultadoFiltros = esquemaFiltrosMovimientos.safeParse({
    ...parametros,
    miembroId:
      typeof parametros.miembroId === 'string' ? parametros.miembroId || undefined : undefined,
    categoriaId:
      typeof parametros.categoriaId === 'string' ? parametros.categoriaId || undefined : undefined,
    desde: typeof parametros.desde === 'string' ? parametros.desde || undefined : undefined,
    hasta: typeof parametros.hasta === 'string' ? parametros.hasta || undefined : undefined,
  });
  const aplicarFiltros = resultadoFiltros.success && !hayValoresDuplicados;
  const filtros = aplicarFiltros
    ? {
        ...(resultadoFiltros.data.miembroId === undefined
          ? {}
          : { miembroId: resultadoFiltros.data.miembroId }),
        ...(resultadoFiltros.data.categoriaId === undefined
          ? {}
          : { categoriaId: resultadoFiltros.data.categoriaId }),
        ...(resultadoFiltros.data.desde === undefined
          ? {}
          : { desde: resultadoFiltros.data.desde }),
        ...(resultadoFiltros.data.hasta === undefined
          ? {}
          : { hasta: resultadoFiltros.data.hasta }),
      }
    : {};
  const [miembros, categorias, movimientos] = await Promise.all([
    listarMiembros({ incluirInactivos: true }),
    listarCategorias({ incluirInactivos: true }),
    listarMovimientos(filtros),
  ]);

  return (
    <div className="movimientos">
      <header className="hogar-titulo">
        <p className="hogar-ceja">Actividad del hogar</p>
        <h1>Movimientos</h1>
        <p>Consulta los ingresos y gastos registrados. Los movimientos no se editan ni eliminan.</p>
      </header>

      <Tarjeta className="movimientos__filtros" titulo="Filtrar movimientos">
        <FiltrosMovimientos
          categorias={categorias}
          filtros={filtros}
          miembros={miembros}
          {...(aplicarFiltros
            ? {}
            : {
                error:
                  'Los filtros de la dirección no son válidos. Se muestran todos los movimientos.',
              })}
        />
      </Tarjeta>

      <div className="movimientos__encabezado">
        <h2>Movimientos registrados</h2>
        <Link className="boton boton--primario" href="/hogar/movimientos/nuevo">
          Registrar movimiento
        </Link>
      </div>

      <Tarjeta className="movimientos__tabla">
        <TablaMovimientos movimientos={movimientos} />
      </Tarjeta>
    </div>
  );
}

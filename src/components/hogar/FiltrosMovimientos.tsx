import Link from 'next/link';
import { Campo } from '@/components/ui/Campo';
import { Selector } from '@/components/ui/Selector';
import type { FilaCategoria, FilaMiembro } from '@/lib/dataService';

type Props = {
  miembros: FilaMiembro[];
  categorias: FilaCategoria[];
  filtros: { miembroId?: string; categoriaId?: string; desde?: string; hasta?: string };
  error?: string;
};

export function FiltrosMovimientos({ miembros, categorias, filtros, error }: Props) {
  return (
    <div className="filtros-movimientos">
      <form action="/hogar/movimientos" className="filtros-movimientos__formulario" method="get">
        <Selector
          etiqueta="Miembro"
          id="filtro-miembro"
          marcador="Todos"
          name="miembroId"
          opciones={miembros.map((miembro) => ({ valor: miembro.id, etiqueta: miembro.nombre }))}
          value={filtros.miembroId ?? ''}
        />
        <Selector
          etiqueta="Categoría"
          id="filtro-categoria"
          marcador="Todas"
          name="categoriaId"
          opciones={categorias.map((categoria) => ({
            valor: categoria.id,
            etiqueta: categoria.nombre,
          }))}
          value={filtros.categoriaId ?? ''}
        />
        <Campo
          etiqueta="Desde"
          id="filtro-desde"
          name="desde"
          type="date"
          value={filtros.desde ?? ''}
        />
        <Campo
          etiqueta="Hasta"
          id="filtro-hasta"
          name="hasta"
          type="date"
          value={filtros.hasta ?? ''}
        />
        <div className="filtros-movimientos__acciones">
          <button className="boton boton--primario" type="submit">
            Filtrar
          </button>
          <Link className="boton boton--secundario" href="/hogar/movimientos">
            Limpiar filtros
          </Link>
        </div>
      </form>
      {error && (
        <p className="filtros-movimientos__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

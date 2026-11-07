import { AccionEstadoCatalogo } from '@/components/hogar/AccionEstadoCatalogo';
import { FormularioCategoria } from '@/components/hogar/FormularioCategoria';
import { FormularioMiembro } from '@/components/hogar/FormularioMiembro';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Insignia } from '@/components/ui/Insignia';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { formatearPesos } from '@/lib/formato';
import { listarCategorias, listarMiembros } from '@/lib/dataService';

export const dynamic = 'force-dynamic';

export default async function CatalogosPage() {
  const [miembros, categorias] = await Promise.all([
    listarMiembros({ incluirInactivos: true }),
    listarCategorias({ incluirInactivos: true }),
  ]);

  return (
    <div className="catalogos">
      <header className="hogar-titulo">
        <p className="hogar-ceja">Configuración del hogar</p>
        <h1>Catálogos</h1>
        <p>Administra a las personas y las categorías que organizan los movimientos.</p>
      </header>

      <div className="catalogos__secciones">
        <Tarjeta className="catalogo-seccion" titulo="Miembros">
          <FormularioMiembro />
          {miembros.length === 0 ? (
            <EstadoVacio titulo="Aún no hay miembros" />
          ) : (
            <div className="tabla-contenedor">
              <table className="tabla-catalogo">
                <thead>
                  <tr>
                    <th scope="col">Nombre</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Movimientos</th>
                    <th scope="col">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {miembros.map((miembro) => (
                    <tr key={miembro.id}>
                      <th data-label="Nombre" scope="row">
                        {miembro.nombre}
                      </th>
                      <td data-label="Estado">
                        <Insignia tono={miembro.activo ? 'verde' : 'neutro'}>
                          {miembro.activo ? 'Activo' : 'Inactivo'}
                        </Insignia>
                      </td>
                      <td data-label="Movimientos">{miembro.totalMovimientos}</td>
                      <td data-label="Acción">
                        <AccionEstadoCatalogo
                          activo={miembro.activo}
                          id={miembro.id}
                          tipo="miembros"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Tarjeta>

        <Tarjeta className="catalogo-seccion" titulo="Categorías">
          <FormularioCategoria />
          {categorias.length === 0 ? (
            <EstadoVacio titulo="Aún no hay categorías" />
          ) : (
            <div className="tabla-contenedor">
              <table className="tabla-catalogo">
                <thead>
                  <tr>
                    <th scope="col">Nombre</th>
                    <th scope="col">Límite mensual</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Movimientos</th>
                    <th scope="col">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.map((categoria) => (
                    <tr key={categoria.id}>
                      <th data-label="Nombre" scope="row">
                        {categoria.nombre}
                      </th>
                      <td data-label="Límite mensual">
                        {categoria.limiteMensual === null
                          ? 'Sin límite'
                          : formatearPesos(categoria.limiteMensual)}
                      </td>
                      <td data-label="Estado">
                        <Insignia tono={categoria.activo ? 'verde' : 'neutro'}>
                          {categoria.activo ? 'Activa' : 'Inactiva'}
                        </Insignia>
                      </td>
                      <td data-label="Movimientos">{categoria.totalMovimientos}</td>
                      <td data-label="Acción">
                        <AccionEstadoCatalogo
                          activo={categoria.activo}
                          id={categoria.id}
                          tipo="categorias"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Tarjeta>
      </div>
    </div>
  );
}

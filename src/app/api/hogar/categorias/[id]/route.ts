import { exigirSesion } from '@/lib/auth/sesion';
import { actualizarCategoria } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaCambiosCategoria, esquemaId } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

export const PATCH = conManejoDeErrores(
  async (request: Request, context: RouteContext<'/api/hogar/categorias/[id]'>) => {
    await exigirSesion();
    const { id } = await context.params;
    const cambiosRecibidos = await leerCuerpo(request, esquemaCambiosCategoria);
    const cambios = {
      ...(cambiosRecibidos.nombre === undefined ? {} : { nombre: cambiosRecibidos.nombre }),
      ...(cambiosRecibidos.limiteMensual === undefined
        ? {}
        : { limiteMensual: cambiosRecibidos.limiteMensual }),
      ...(cambiosRecibidos.activo === undefined ? {} : { activo: cambiosRecibidos.activo }),
    };
    await actualizarCategoria(esquemaId.parse(id), cambios);
    return responderOk({ actualizado: true });
  },
);

import { exigirSesion } from '@/lib/auth/sesion';
import { actualizarMiembro } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaCambiosMiembro, esquemaId } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

export const PATCH = conManejoDeErrores(
  async (request: Request, context: RouteContext<'/api/hogar/miembros/[id]'>) => {
    await exigirSesion();
    const { id } = await context.params;
    const cambiosRecibidos = await leerCuerpo(request, esquemaCambiosMiembro);
    const cambios = {
      ...(cambiosRecibidos.nombre === undefined ? {} : { nombre: cambiosRecibidos.nombre }),
      ...(cambiosRecibidos.activo === undefined ? {} : { activo: cambiosRecibidos.activo }),
    };
    await actualizarMiembro(esquemaId.parse(id), cambios);
    return responderOk({ actualizado: true });
  },
);

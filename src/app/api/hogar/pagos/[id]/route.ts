import { exigirSesion } from '@/lib/auth/sesion';
import { eliminarPago } from '@/lib/dataService';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { esquemaId } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

export const DELETE = conManejoDeErrores(
  async (_request: Request, context: RouteContext<'/api/hogar/pagos/[id]'>) => {
    await exigirSesion();
    const { id } = await context.params;
    await eliminarPago(esquemaId.parse(id));
    return responderOk({ eliminado: true });
  },
);

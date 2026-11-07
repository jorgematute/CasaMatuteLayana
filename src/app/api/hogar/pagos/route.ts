import { exigirSesion } from '@/lib/auth/sesion';
import { crearPago, listarPagos } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaFiltrosPagos, esquemaPago } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async (request: Request) => {
  await exigirSesion();
  const filtrosValidados = esquemaFiltrosPagos.parse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  const filtros = filtrosValidados.estado === undefined ? {} : { estado: filtrosValidados.estado };
  return responderOk(await listarPagos(filtros));
});

export const POST = conManejoDeErrores(async (request: Request) => {
  await exigirSesion();
  const datos = await leerCuerpo(request, esquemaPago);
  return responderOk(await crearPago(datos), 201);
});

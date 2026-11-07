import { exigirSesion } from '@/lib/auth/sesion';
import { crearMiembro, listarMiembros } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaFiltrosCatalogos, esquemaMiembro } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async (request: Request) => {
  await exigirSesion();
  const filtros = esquemaFiltrosCatalogos.parse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  return responderOk(await listarMiembros(filtros));
});

export const POST = conManejoDeErrores(async (request: Request) => {
  await exigirSesion();
  const { nombre } = await leerCuerpo(request, esquemaMiembro);
  return responderOk(await crearMiembro(nombre), 201);
});

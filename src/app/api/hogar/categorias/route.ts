import { exigirSesion } from '@/lib/auth/sesion';
import { crearCategoria, listarCategorias } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaCategoria, esquemaFiltrosCatalogos } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async (request: Request) => {
  await exigirSesion();
  const filtros = esquemaFiltrosCatalogos.parse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  return responderOk(await listarCategorias(filtros));
});

export const POST = conManejoDeErrores(async (request: Request) => {
  await exigirSesion();
  const datos = await leerCuerpo(request, esquemaCategoria);
  return responderOk(await crearCategoria(datos), 201);
});

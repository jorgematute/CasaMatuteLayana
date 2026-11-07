import { exigirSesion } from '@/lib/auth/sesion';
import { listarMovimientos, registrarMovimiento } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaFiltrosMovimientos, esquemaMovimiento } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async (request: Request) => {
  await exigirSesion();
  const filtrosValidados = esquemaFiltrosMovimientos.parse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  const filtros = {
    ...(filtrosValidados.miembroId === undefined ? {} : { miembroId: filtrosValidados.miembroId }),
    ...(filtrosValidados.categoriaId === undefined
      ? {}
      : { categoriaId: filtrosValidados.categoriaId }),
    ...(filtrosValidados.desde === undefined ? {} : { desde: filtrosValidados.desde }),
    ...(filtrosValidados.hasta === undefined ? {} : { hasta: filtrosValidados.hasta }),
  };
  return responderOk(await listarMovimientos(filtros));
});

export const POST = conManejoDeErrores(async (request: Request) => {
  const sesion = await exigirSesion();
  const datos = await leerCuerpo(request, esquemaMovimiento);
  const resultado = await registrarMovimiento(
    {
      miembroId: datos.miembroId,
      categoriaId: datos.categoriaId,
      tipo: datos.tipo,
      monto: datos.monto,
      fecha: datos.fecha,
      ...(datos.esHormiga === undefined ? {} : { esHormiga: datos.esHormiga }),
      ...(datos.pagoPendienteId === undefined ? {} : { pagoPendienteId: datos.pagoPendienteId }),
    },
    sesion.email,
  );
  return responderOk(resultado, 201);
});

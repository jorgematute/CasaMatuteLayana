import { obtenerPanel } from '@/lib/dataService';
import { exigirSesion } from '@/lib/auth/sesion';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async () => {
  await exigirSesion();
  return responderOk(await obtenerPanel());
});

import { exigirSesion } from '@/lib/auth/sesion';
import { responderOk, conManejoDeErrores } from '@/lib/http/respuestas';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async () => {
  const sesion = await exigirSesion();
  return responderOk({ email: sesion.email });
});

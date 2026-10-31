import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function obtenerSesion(): Promise<{ email: string } | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error && error.name !== 'AuthSessionMissingError') {
    throw error;
  }

  if (!user) {
    return null;
  }

  return { email: user.email ?? user.id };
}

export async function exigirSesion(): Promise<{ email: string }> {
  const sesion = await obtenerSesion();

  if (!sesion) {
    throw new ErrorDeNegocio('NO_AUTORIZADO');
  }

  return sesion;
}

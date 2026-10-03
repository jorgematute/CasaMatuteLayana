import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from './server';
import { getSupabaseConfig } from './env';

export async function requireAdmin() {
  const sessionClient = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await sessionClient.auth.getUser();
  if (authError || !user) {
    return { response: NextResponse.json({ error: 'Inicia sesión para continuar.' }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await sessionClient
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError || !profile?.is_admin) {
    return { response: NextResponse.json({ error: 'No tienes permiso para administrar cuentas.' }, { status: 403 }) };
  }

  const serviceKey = process.env.CASAMATUTELAYANA_SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return { response: NextResponse.json({ error: 'Falta configurar el acceso administrativo de Supabase.' }, { status: 503 }) };
  }

  const { url } = getSupabaseConfig();
  const adminClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return { user, adminClient };
}
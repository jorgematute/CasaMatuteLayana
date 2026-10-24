import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12).max(128),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  const parsed = passwordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'La nueva contraseña debe tener entre 12 y 128 caracteres.' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user?.email) {
    return NextResponse.json({ error: 'Debes iniciar sesión para cambiar la contraseña.' }, { status: 401 });
  }

  const { data: reauthenticated, error: reauthenticationError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });
  if (reauthenticationError || reauthenticated.user?.id !== user.id) {
    return NextResponse.json({ error: 'La contraseña actual es incorrecta.' }, { status: 400 });
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) {
    return NextResponse.json({ error: 'No se pudo cambiar la contraseña. Intenta de nuevo.' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

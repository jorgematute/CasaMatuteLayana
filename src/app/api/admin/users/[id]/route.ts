import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/supabase/admin';

const updateUserSchema = z.object({
  email: z.string().trim().email().max(254),
  fullName: z.string().trim().min(1).max(100),
  password: z.union([z.literal(''), z.string().min(12).max(128)]),
  isHouseholdMember: z.boolean(),
  isAdmin: z.boolean(),
});

interface RouteContext { params: Promise<{ id: string }> }

export async function PUT(request: Request, context: RouteContext) {
  const access = await requireAdmin();
  if ('response' in access) return access.response;

  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Identificador de cuenta inválido.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Revisa los datos.' }, { status: 400 });
  }

  const { email, fullName, password, isHouseholdMember, isAdmin } = parsed.data;
  if (id === access.user.id && !isAdmin) {
    return NextResponse.json({ error: 'No puedes quitarte tu propio permiso de administrador.' }, { status: 400 });
  }

  const authUpdate: { email: string; email_confirm: boolean; user_metadata: { full_name: string }; password?: string } = {
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  };
  if (password) authUpdate.password = password;

  const { data, error } = await access.adminClient.auth.admin.updateUserById(id, authUpdate);
  if (error || !data.user) {
    return NextResponse.json({ error: error?.message ?? 'No se pudo actualizar la cuenta.' }, { status: 400 });
  }

  const { data: profile, error: profileError } = await access.adminClient
    .from('users')
    .update({ email, full_name: fullName, is_household_member: isHouseholdMember, is_admin: isAdmin })
    .eq('id', id)
    .select('id,email,full_name,is_household_member,is_admin,created_at')
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'No se pudo actualizar el perfil de la cuenta.' }, { status: 500 });
  }

  return NextResponse.json({ user: profile });
}
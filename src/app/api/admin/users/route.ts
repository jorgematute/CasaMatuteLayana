import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/supabase/admin';

const createUserSchema = z.object({
  email: z.string().trim().email().max(254),
  fullName: z.string().trim().min(1).max(100),
  password: z.string().min(12).max(128),
  isHouseholdMember: z.boolean(),
  isAdmin: z.boolean(),
});

export async function GET() {
  const access = await requireAdmin();
  if ('response' in access) return access.response;

  const { data, error } = await access.adminClient
    .from('users')
    .select('id,email,full_name,is_household_member,is_admin,created_at')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'No se pudieron cargar las cuentas.' }, { status: 500 });
  return NextResponse.json({ users: data });
}

export async function POST(request: Request) {
  const access = await requireAdmin();
  if ('response' in access) return access.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Revisa los datos.' }, { status: 400 });
  }

  const { email, fullName, password, isHouseholdMember, isAdmin } = parsed.data;
  const { data, error } = await access.adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) {
    return NextResponse.json({ error: error?.message ?? 'No se pudo crear la cuenta.' }, { status: 400 });
  }

  const { data: profile, error: profileError } = await access.adminClient
    .from('users')
    .update({ email, full_name: fullName, is_household_member: isHouseholdMember, is_admin: isAdmin })
    .eq('id', data.user.id)
    .select('id,email,full_name,is_household_member,is_admin,created_at')
    .single();

  if (profileError) {
    await access.adminClient.auth.admin.deleteUser(data.user.id);
    return NextResponse.json({ error: 'No se pudo guardar el perfil de la cuenta.' }, { status: 500 });
  }

  return NextResponse.json({ user: profile }, { status: 201 });
}
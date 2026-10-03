import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  return NextResponse.json({ success: true, data: { user: { id: user.id, email: user.email, name: user.user_metadata.full_name ?? '' } } });
}
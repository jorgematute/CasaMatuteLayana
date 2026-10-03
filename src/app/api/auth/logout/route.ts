import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) return NextResponse.json({ success: false, error: 'No se pudo cerrar sesión' }, { status: 500 });
  return NextResponse.json({ success: true });
}
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { count } from '@/lib/supabase/database';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function StatusPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const notes = await count(supabase, 'note');
  const example = await count(supabase, 'example');
  return <main className="shell"><nav className="nav"><Link className="brand" href="/">Casa <span>Matute</span></Link><div className="navlinks"><Link href="/">Inicio</Link><Link href="/notes">Notas</Link></div></nav><section className="section" style={{ paddingTop: 72 }}><div className="eyebrow">Observabilidad</div><div className="section-header"><h1 style={{ fontSize: 'clamp(3.5rem, 8vw, 7rem)', margin: '16px 0 36px' }}>Estado.</h1><span className="mono">ONLINE</span></div><div className="cards"><article className="card"><div className="eyebrow">Servicio</div><h3>● Operativo</h3><p>API health responde correctamente.</p></article><article className="card"><div className="eyebrow">Colección / note</div><h3>{notes} registros</h3><p>Notas almacenadas en Supabase.</p></article><article className="card"><div className="eyebrow">Colección / example</div><h3>{example} registros</h3><p>Datos de referencia en Supabase.</p></article></div></section></main>;
}

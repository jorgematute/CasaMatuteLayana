import Link from 'next/link';
import { count } from '@/lib/json-db';

export default async function StatusPage() {
  const notes = await count('note');
  const example = await count('example');
  return <main className="shell"><nav className="nav"><Link className="brand" href="/">Casa <span>Matute</span></Link><div className="navlinks"><Link href="/">Inicio</Link><Link href="/notes">Notas</Link></div></nav><section className="section" style={{ paddingTop: 72 }}><div className="eyebrow">Observabilidad</div><div className="section-header"><h1 style={{ fontSize: 'clamp(3.5rem, 8vw, 7rem)', margin: '16px 0 36px' }}>Estado.</h1><span className="mono">ONLINE</span></div><div className="cards"><article className="card"><div className="eyebrow">Servicio</div><h3>● Operativo</h3><p>API health responde correctamente.</p></article><article className="card"><div className="eyebrow">Colección / note</div><h3>{notes} registros</h3><p>Notas almacenadas localmente.</p></article><article className="card"><div className="eyebrow">Colección / example</div><h3>{example} registros</h3><p>Datos de referencia disponibles.</p></article></div></section></main>;
}

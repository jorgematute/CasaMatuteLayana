import Link from 'next/link';
import { getAll } from '@/lib/json-db';
import type { BaseRecord } from '@/lib/types';

interface Note extends BaseRecord { title: string; content: string; category: string; pinned: boolean }

export default async function NotesPage() {
  const notes = await getAll<Note>('note', { limit: 100 });
  return <main className="shell"><nav className="nav"><Link className="brand" href="/">Casa <span>Matute</span></Link><div className="navlinks"><Link href="/">Inicio</Link><Link href="/status">Estado</Link></div></nav><section className="section" style={{ paddingTop: 72 }}><div className="eyebrow">Archivo de ideas</div><div className="section-header"><h1 style={{ fontSize: 'clamp(3.5rem, 8vw, 7rem)', margin: '16px 0 36px' }}>Notas.</h1><span className="mono">{notes.total.toString().padStart(2, '0')} entradas</span></div><div className="cards">{notes.data.length ? notes.data.map((note) => <article className="card" key={note.id}><div className="eyebrow">{note.category}</div><h3>{note.title}</h3><p>{note.content}</p></article>) : <article className="card"><h3>El espacio está listo.</h3><p>Crea tu primera nota usando la API: POST /api/data/note.</p></article>}</div></section></main>;
}

import Link from 'next/link';

export default function HomePage() {
  return <main className="shell">
    <nav className="nav"><Link className="brand" href="/">Casa <span>Matute</span></Link><div className="navlinks"><Link href="/notes">Notas</Link><Link href="/status">Estado</Link><Link href="/api/health">API Health</Link></div></nav>
    <section className="hero"><div><div className="eyebrow">Sistema operativo · v0.1.0</div><h1>Ideas que encuentran casa.</h1><p>Una base fullstack en TypeScript para organizar notas, datos y decisiones con claridad. Persistencia JSON, API tipada y una interfaz lista para crecer.</p><Link className="cta" href="/notes">Abrir notas →</Link></div><div className="mark"><small>CASA / MATUTE / LAYANA</small><strong>CM<br />↗</strong><small>Construido con intención.</small></div></section>
    <section className="section"><div className="section-header"><h2>El sistema, de un vistazo.</h2><span className="mono">01 — 03</span></div><div className="cards"><article className="card"><h3>Notas</h3><p>Captura y ordena ideas con categorías y prioridades.</p></article><article className="card"><h3>Datos</h3><p>CRUD genérico validado con Zod y respaldos automáticos.</p></article><article className="card"><h3>Salud</h3><p>Observa versión, entorno y estado del servicio en tiempo real.</p></article></div></section>
    <footer className="footer"><span>Casa Matute Layana</span><span className="mono">TS / JSON / 2026</span></footer>
  </main>;
}

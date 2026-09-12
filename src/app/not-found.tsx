import Link from 'next/link';

export default function NotFound() { return <main className="shell"><section className="hero"><div><div className="eyebrow">404 / fuera de ruta</div><h1>Esta página tomó otro camino.</h1><p>La dirección no existe en Casa Matute Layana.</p><Link className="cta" href="/">Volver al inicio</Link></div></section></main>; }

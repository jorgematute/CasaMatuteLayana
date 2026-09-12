'use client';

export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="shell"><section className="hero"><div><div className="eyebrow">500 / algo salió mal</div><h1>Podemos reintentarlo.</h1><button className="cta" onClick={reset}>Reintentar</button></div></section></main>; }

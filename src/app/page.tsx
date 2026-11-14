import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import AccountActions from '@/app/account/account-actions';

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = user
    ? await supabase.from('users').select('is_admin').eq('id', user.id).maybeSingle()
    : { data: null };

  return (
    <main className="inicio">
      <header className="inicio-encabezado">
        <nav className="inicio-encabezado__fila" aria-label="Navegación principal">
          <Link className="hogar-marca" href="/">
            Casa <span>Matute</span>
          </Link>
          <div className="inicio-enlaces">
            <Link href="/hogar">Presupuesto</Link>
            <Link href="/notes">Notas</Link>
            <Link href="/status">Estado</Link>
            {profile?.is_admin && <Link href="/admin/users">Cuentas</Link>}
            <Link href="/api/health">API Health</Link>
          </div>
          <div className="inicio-sesion">
            <AccountActions />
          </div>
        </nav>
      </header>

      <section className="inicio-portada">
        <div className="inicio-portada__contenido">
          <p className="inicio-ceja">Sistema operativo · v0.1.0</p>
          <h1>Ideas que encuentran casa.</h1>
          <p>
            Una base fullstack en TypeScript para organizar notas, datos y decisiones con claridad.
            Persistencia JSON, API tipada y una interfaz lista para crecer.
          </p>
          <div className="inicio-portada__acciones">
            <Link className="boton boton--primario" href="/notes">
              Abrir notas
            </Link>
            <Link className="boton boton--secundario" href="/hogar">
              Ir al presupuesto
            </Link>
          </div>
        </div>
        <div className="inicio-sello" aria-label="Casa Matute Layana">
          <span>CASA / MATUTE / LAYANA</span>
          <strong>CM</strong>
          <span>Construido con intención.</span>
        </div>
      </section>

      <section className="inicio-seccion">
        <div className="inicio-seccion__encabezado">
          <div>
            <p className="inicio-ceja">Herramientas</p>
            <h2>El sistema, de un vistazo.</h2>
          </div>
          <span className="mono">01 — 03</span>
        </div>
        <div className="inicio-tarjetas">
          <article className="inicio-tarjeta">
            <span className="inicio-tarjeta__numero">01</span>
            <h3>Notas</h3>
            <p>Captura y ordena ideas con categorías y prioridades.</p>
          </article>
          <article className="inicio-tarjeta">
            <span className="inicio-tarjeta__numero">02</span>
            <h3>Datos</h3>
            <p>CRUD genérico validado con Zod y respaldos automáticos.</p>
          </article>
          <article className="inicio-tarjeta">
            <span className="inicio-tarjeta__numero">03</span>
            <h3>Salud</h3>
            <p>Observa versión, entorno y estado del servicio en tiempo real.</p>
          </article>
        </div>
      </section>

      <footer className="inicio-pie">
        <span>Casa Matute Layana</span>
        <span className="mono">TS / JSON / 2026</span>
      </footer>
    </main>
  );
}

import Link from 'next/link';
import { redirect } from 'next/navigation';
import AccountActions from './account-actions';
import PasswordForm from './password-form';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <main className="shell">
      <nav className="nav">
        <Link className="brand" href="/">Casa <span>Matute</span></Link>
        <div className="navlinks">
          <Link href="/">Inicio</Link>
          <Link href="/notes">Notas</Link>
          <Link href="/status">Estado</Link>
        </div>
        <AccountActions />
      </nav>
      <section className="account-content">
        <div className="eyebrow">Tu espacio personal</div>
        <h1>Mi cuenta.</h1>
        <p className="account-email">{user.email}</p>
        <div className="account-password-panel">
          <h2>Cambiar contraseña</h2>
          <p>Confirma tu contraseña actual para guardar una nueva.</p>
          <PasswordForm />
        </div>
      </section>
    </main>
  );
}

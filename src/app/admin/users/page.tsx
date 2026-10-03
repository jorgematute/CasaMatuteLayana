import Link from 'next/link';
import UsersManager from './users-manager';

export default function AdminUsersPage() {
  return (
    <main className="shell users-admin-shell">
      <nav className="nav">
        <Link className="brand" href="/">Casa <span>Matute</span></Link>
        <div className="navlinks">
          <Link href="/">Inicio</Link>
          <Link href="/notes">Notas</Link>
          <span className="users-admin-nav-current">Cuentas</span>
        </div>
      </nav>
      <UsersManager />
      <footer className="footer"><span>Casa Matute Layana</span><span className="mono">ADMIN / ACCESOS</span></footer>
    </main>
  );
}
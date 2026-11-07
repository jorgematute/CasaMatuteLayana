'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import AccountActions from '@/app/account/account-actions';

const enlaces = [
  { href: '/hogar', etiqueta: 'Panel' },
  { href: '/hogar/movimientos', etiqueta: 'Movimientos' },
  { href: '/hogar/pagos', etiqueta: 'Pagos' },
  { href: '/hogar/catalogos', etiqueta: 'Catálogos' },
];

export function NavegacionHogar({ correo }: { correo: string }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const ruta = usePathname();

  return (
    <header className="hogar-encabezado">
      <div className="hogar-encabezado__fila">
        <Link aria-label="Casa Matute, panel" className="hogar-marca" href="/hogar">
          Casa <span>Matute</span>
        </Link>
        <button
          aria-controls="hogar-enlaces"
          aria-expanded={menuAbierto}
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          className="hogar-menu-boton"
          onClick={() => setMenuAbierto(!menuAbierto)}
          type="button"
        >
          <span aria-hidden="true">{menuAbierto ? 'Cerrar' : 'Menú'}</span>
        </button>
        <nav
          aria-label="Navegación principal"
          className={`hogar-enlaces${menuAbierto ? ' hogar-enlaces--abiertos' : ''}`}
          id="hogar-enlaces"
        >
          {enlaces.map(({ href, etiqueta }) => (
            <Link
              aria-current={ruta === href ? 'page' : undefined}
              href={href}
              key={href}
              onClick={() => setMenuAbierto(false)}
            >
              {etiqueta}
            </Link>
          ))}
        </nav>
        <div className="hogar-sesion">
          <span className="hogar-sesion__correo" title={correo}>
            {correo}
          </span>
          <AccountActions mostrarCuenta={false} />
        </div>
      </div>
    </header>
  );
}

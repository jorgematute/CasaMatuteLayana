import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { NavegacionHogar } from '@/components/hogar/NavegacionHogar';
import { obtenerSesion } from '@/lib/auth/sesion';

export const dynamic = 'force-dynamic';

export default async function LayoutHogar({ children }: { children: ReactNode }) {
  const sesion = await obtenerSesion();

  if (!sesion) {
    redirect('/login');
  }

  return (
    <div className="hogar">
      <NavegacionHogar correo={sesion.email} />
      <main className="hogar-contenido">{children}</main>
    </div>
  );
}

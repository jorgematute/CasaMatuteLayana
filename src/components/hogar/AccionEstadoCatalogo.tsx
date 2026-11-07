'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Boton } from '@/components/ui/Boton';

type TipoCatalogo = 'miembros' | 'categorias';

type RespuestaApi = {
  error?: { mensaje?: string };
};

export function AccionEstadoCatalogo({
  id,
  tipo,
  activo,
}: {
  id: string;
  tipo: TipoCatalogo;
  activo: boolean;
}) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  async function cambiarEstado() {
    setCargando(true);
    setError('');

    try {
      const respuesta = await fetch(`/api/hogar/${tipo}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !activo }),
      });
      const resultado = (await respuesta.json()) as RespuestaApi;

      if (!respuesta.ok) {
        setError(resultado.error?.mensaje ?? 'No se pudo actualizar el estado.');
        return;
      }

      router.refresh();
    } catch {
      setError('No se pudo conectar. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="catalogo-accion">
      <Boton cargando={cargando} onClick={cambiarEstado} type="button" variante="secundario">
        {activo ? 'Desactivar' : 'Activar'}
      </Boton>
      {error && (
        <span className="campo__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

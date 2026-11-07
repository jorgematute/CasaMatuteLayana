'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';

type RespuestaApi = {
  error?: { mensaje?: string };
};

export function FormularioMiembro() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function crear(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setCargando(true);

    try {
      const respuesta = await fetch('/api/hogar/miembros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre }),
      });
      const resultado = (await respuesta.json()) as RespuestaApi;

      if (!respuesta.ok) {
        setError(resultado.error?.mensaje ?? 'No se pudo crear el miembro.');
        return;
      }

      setNombre('');
      router.refresh();
    } catch {
      setError('No se pudo conectar. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <form className="catalogo-formulario" onSubmit={crear}>
      <Campo
        autoComplete="off"
        etiqueta="Nombre del miembro"
        id="nombre-miembro"
        maxLength={80}
        minLength={2}
        name="nombre"
        onChange={(event) => setNombre(event.target.value)}
        required
        value={nombre}
      />
      {error && <Aviso tipo="error">{error}</Aviso>}
      <div className="catalogo-formulario__acciones">
        <Boton cargando={cargando} type="submit">
          Crear miembro
        </Boton>
      </div>
    </form>
  );
}

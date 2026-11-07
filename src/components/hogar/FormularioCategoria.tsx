'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';

type RespuestaApi = {
  error?: { mensaje?: string };
};

export function FormularioCategoria() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [limite, setLimite] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function crear(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setCargando(true);

    try {
      const respuesta = await fetch('/api/hogar/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          limiteMensual: limite.trim() ? Number(limite) : null,
        }),
      });
      const resultado = (await respuesta.json()) as RespuestaApi;

      if (!respuesta.ok) {
        setError(resultado.error?.mensaje ?? 'No se pudo crear la categoría.');
        return;
      }

      setNombre('');
      setLimite('');
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
        etiqueta="Nombre de la categoría"
        id="nombre-categoria"
        maxLength={80}
        minLength={2}
        name="nombre"
        onChange={(event) => setNombre(event.target.value)}
        required
        value={nombre}
      />
      <Campo
        etiqueta="Límite mensual (opcional)"
        id="limite-categoria"
        min={1}
        name="limiteMensual"
        onChange={(event) => setLimite(event.target.value)}
        placeholder="Sin límite"
        step={1}
        type="number"
        value={limite}
      />
      {error && <Aviso tipo="error">{error}</Aviso>}
      <div className="catalogo-formulario__acciones">
        <Boton cargando={cargando} type="submit">
          Crear categoría
        </Boton>
      </div>
    </form>
  );
}

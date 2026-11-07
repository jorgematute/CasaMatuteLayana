'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { hoyBogota, esFechaFutura } from '@/lib/reglas/fechas';
import { MENSAJES } from '@/lib/reglas/errores';
import { esquemaPago } from '@/lib/validacion/esquemas';

type RespuestaApi = {
  error?: { codigo?: string; mensaje?: string };
};

type Props = {
  fechaMinima: string;
};

export function FormularioPago({ fechaMinima }: Props) {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [monto, setMonto] = useState('');
  const [fechaLimite, setFechaLimite] = useState(fechaMinima);
  const [recurrente, setRecurrente] = useState(false);
  const [abonable, setAbonable] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function crear(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const resultado = esquemaPago.safeParse({
      nombre: nombre.trim(),
      monto: Number(monto),
      fechaLimite,
      recurrente,
      abonable,
    });

    if (!resultado.success) {
      setError('Revise los datos ingresados.');
      return;
    }

    if (!esFechaFutura(resultado.data.fechaLimite, hoyBogota())) {
      setError(MENSAJES.FECHA_NO_FUTURA);
      return;
    }

    setCargando(true);
    try {
      const respuesta = await fetch('/api/hogar/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resultado.data),
      });
      const cuerpo = (await respuesta.json()) as RespuestaApi;

      if (!respuesta.ok) {
        setError(cuerpo.error?.mensaje ?? 'No se pudo registrar el pago.');
        return;
      }

      router.push('/hogar/pagos');
    } catch {
      setError('No se pudo conectar. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <form className="pago-formulario" noValidate onSubmit={crear}>
      <Campo
        autoComplete="off"
        etiqueta="Nombre del pago"
        id="nombre-pago"
        maxLength={120}
        minLength={2}
        name="nombre"
        onChange={(event) => setNombre(event.target.value)}
        required
        value={nombre}
      />
      <Campo
        etiqueta="Monto"
        id="monto-pago"
        min={1}
        name="monto"
        onChange={(event) => setMonto(event.target.value)}
        required
        step={1}
        type="number"
        value={monto}
      />
      <Campo
        etiqueta="Fecha límite"
        id="fecha-limite-pago"
        min={fechaMinima}
        name="fechaLimite"
        onChange={(event) => setFechaLimite(event.target.value)}
        required
        type="date"
        value={fechaLimite}
      />
      <div className="pago-formulario__opciones">
        <label>
          <input
            checked={recurrente}
            name="recurrente"
            onChange={(event) => setRecurrente(event.target.checked)}
            type="checkbox"
          />
          <span>Recurrente</span>
        </label>
        <label>
          <input
            checked={abonable}
            name="abonable"
            onChange={(event) => setAbonable(event.target.checked)}
            type="checkbox"
          />
          <span>Abonable</span>
        </label>
      </div>
      {error && <Aviso tipo="error">{error}</Aviso>}
      <div className="pago-formulario__acciones">
        <Boton cargando={cargando} type="submit">
          Registrar pago
        </Boton>
      </div>
    </form>
  );
}

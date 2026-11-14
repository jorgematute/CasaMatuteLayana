'use client';

import { useEffect, useState } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { Selector } from '@/components/ui/Selector';
import { formatearPesos } from '@/lib/formato';

export type PagoSeleccionable = {
  id: string;
  nombre: string;
  abonable: boolean;
  restante: number;
};

type RespuestaApi = {
  datos?: PagoSeleccionable[];
  error?: { mensaje?: string };
};

type Props = {
  pagoId: string;
  onChange: (pago: PagoSeleccionable | null) => void;
};

export function SelectorPago({ pagoId, onChange }: Props) {
  const [pagos, setPagos] = useState<PagoSeleccionable[]>([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const controlador = new AbortController();

    async function cargarPagos() {
      try {
        const respuesta = await fetch('/api/hogar/pagos?estado=pendiente', {
          signal: controlador.signal,
        });
        const cuerpo = (await respuesta.json()) as RespuestaApi;

        if (!respuesta.ok || !cuerpo.datos) {
          setError(cuerpo.error?.mensaje ?? 'No se pudieron cargar los pagos pendientes.');
          return;
        }

        setPagos(cuerpo.datos);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setError('No se pudieron cargar los pagos pendientes. Intenta de nuevo.');
      } finally {
        if (!controlador.signal.aborted) setCargando(false);
      }
    }

    void cargarPagos();
    return () => controlador.abort();
  }, []);

  const seleccionado = pagos.find((pago) => pago.id === pagoId) ?? null;

  return (
    <div className="selector-pago">
      <Selector
        disabled={cargando}
        etiqueta="Asociar a un pago (opcional)"
        id="pago-pendiente"
        marcador={cargando ? 'Cargando pagos…' : 'Sin pago asociado'}
        name="pagoPendienteId"
        onChange={(event) => onChange(pagos.find((pago) => pago.id === event.target.value) ?? null)}
        opciones={pagos.map((pago) => ({
          valor: pago.id,
          etiqueta: `${pago.nombre} · Restante ${formatearPesos(pago.restante)}`,
        }))}
        value={pagoId}
      />
      {error && <Aviso tipo="error">{error}</Aviso>}
      {seleccionado?.abonable && (
        <p className="campo__ayuda">Restante del pago: {formatearPesos(seleccionado.restante)}</p>
      )}
    </div>
  );
}

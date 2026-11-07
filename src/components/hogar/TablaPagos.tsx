'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { InsigniaEstadoPago } from '@/components/hogar/InsigniaEstadoPago';
import { InsigniaUrgencia } from '@/components/hogar/InsigniaUrgencia';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import type { FilaPago } from '@/lib/dataService';
import { formatearFecha, formatearPesos } from '@/lib/formato';
import { diasRestantes, hoyBogota } from '@/lib/reglas/fechas';
import { nivelUrgencia } from '@/lib/reglas/urgencia';

type RespuestaApi = {
  error?: { codigo?: string; mensaje?: string };
};

export function TablaPagos({ pagos }: { pagos: FilaPago[] }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [idEliminando, setIdEliminando] = useState<string | null>(null);

  async function eliminar(id: string, nombre: string) {
    if (!window.confirm(`¿Eliminar el pago "${nombre}"?`)) {
      return;
    }

    setError('');
    setIdEliminando(id);
    try {
      const respuesta = await fetch(`/api/hogar/pagos/${id}`, { method: 'DELETE' });
      const cuerpo = (await respuesta.json()) as RespuestaApi;

      if (!respuesta.ok) {
        setError(cuerpo.error?.mensaje ?? 'No se pudo eliminar el pago.');
        return;
      }

      router.refresh();
    } catch {
      setError('No se pudo conectar. Intenta de nuevo.');
    } finally {
      setIdEliminando(null);
    }
  }

  if (pagos.length === 0) {
    return (
      <>
        {error && <Aviso tipo="error">{error}</Aviso>}
        <EstadoVacio titulo="No hay pagos registrados" />
      </>
    );
  }

  return (
    <>
      {error && (
        <Aviso className="pagos__error" tipo="error">
          {error}
        </Aviso>
      )}
      <div className="tabla-contenedor">
        <table className="tabla-catalogo tabla-pagos">
          <thead>
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col">Monto</th>
              <th scope="col">Abonado</th>
              <th scope="col">Restante</th>
              <th scope="col">Fecha límite</th>
              <th scope="col">Urgencia</th>
              <th scope="col">Estado</th>
              <th scope="col">Abonable</th>
              <th scope="col">Acción</th>
            </tr>
          </thead>
          <tbody>
            {pagos.map((pago) => {
              const eliminable = pago.estado === 'pendiente' && pago.abonado === 0;
              const nivel =
                pago.estado === 'pendiente'
                  ? nivelUrgencia(diasRestantes(pago.fechaLimite, hoyBogota()))
                  : null;

              return (
                <tr key={pago.id}>
                  <th data-label="Nombre" scope="row">
                    {pago.nombre}
                  </th>
                  <td data-label="Monto">{formatearPesos(pago.monto)}</td>
                  <td data-label="Abonado">{formatearPesos(pago.abonado)}</td>
                  <td data-label="Restante">{formatearPesos(pago.restante)}</td>
                  <td data-label="Fecha límite">{formatearFecha(pago.fechaLimite)}</td>
                  <td data-label="Urgencia">{nivel ? <InsigniaUrgencia nivel={nivel} /> : '—'}</td>
                  <td data-label="Estado">
                    <InsigniaEstadoPago estado={pago.estado} />
                  </td>
                  <td data-label="Abonable">{pago.abonable ? 'Sí' : 'No'}</td>
                  <td className="catalogo-accion" data-label="Acción">
                    {eliminable && (
                      <Boton
                        cargando={idEliminando === pago.id}
                        disabled={idEliminando !== null && idEliminando !== pago.id}
                        onClick={() => eliminar(pago.id, pago.nombre)}
                        type="button"
                        variante="peligro"
                      >
                        Eliminar
                      </Boton>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="pagos__pie">
        <Link className="boton boton--secundario" href="/hogar">
          Volver al panel
        </Link>
      </div>
    </>
  );
}

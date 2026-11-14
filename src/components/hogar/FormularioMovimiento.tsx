'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { SelectorPago, type PagoSeleccionable } from '@/components/hogar/SelectorPago';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Selector } from '@/components/ui/Selector';
import type {
  DesgloseSaldo,
  FilaCategoria,
  FilaMiembro,
  ResultadoMovimiento,
} from '@/lib/dataService';
import { formatearPesos } from '@/lib/formato';
import { MENSAJES } from '@/lib/reglas/errores';
import { esquemaMovimiento } from '@/lib/validacion/esquemas';

type RespuestaApi = {
  datos?: ResultadoMovimiento;
  error?: {
    codigo?: string;
    mensaje?: string;
    detalles?: unknown;
  };
};

type Props = {
  miembros: FilaMiembro[];
  categorias: FilaCategoria[];
  saldo: DesgloseSaldo;
  fechaHoy: string;
};

function saldoDisponibleDesde(detalles: unknown): number | null {
  if (typeof detalles !== 'object' || detalles === null || !('saldoDisponible' in detalles)) {
    return null;
  }
  const saldo = detalles.saldoDisponible;
  return typeof saldo === 'number' && Number.isFinite(saldo) ? saldo : null;
}

export function FormularioMovimiento({ miembros, categorias, saldo, fechaHoy }: Props) {
  const router = useRouter();
  const [tipo, setTipo] = useState<'ingreso' | 'gasto'>('ingreso');
  const [miembroId, setMiembroId] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(fechaHoy);
  const [esHormiga, setEsHormiga] = useState(false);
  const [pago, setPago] = useState<PagoSeleccionable | null>(null);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState<ResultadoMovimiento | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!resultado) return;
    const temporizador = window.setTimeout(() => router.push('/hogar/movimientos'), 1600);
    return () => window.clearTimeout(temporizador);
  }, [resultado, router]);

  function cambiarTipo(nuevoTipo: 'ingreso' | 'gasto') {
    setTipo(nuevoTipo);
    if (nuevoTipo === 'ingreso') {
      setEsHormiga(false);
      setPago(null);
    }
    setError('');
  }

  function seleccionarTipo(valor: string) {
    if (valor === 'ingreso' || valor === 'gasto') {
      cambiarTipo(valor);
    }
  }

  function cambiarPago(nuevoPago: PagoSeleccionable | null) {
    setPago(nuevoPago);
    if (nuevoPago && !nuevoPago.abonable) {
      setMonto(String(nuevoPago.restante));
    } else if (pago && !pago.abonable) {
      setMonto('');
    }
  }

  async function registrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setResultado(null);

    const datos = {
      miembroId,
      categoriaId,
      tipo,
      monto: Number(monto),
      fecha,
      esHormiga,
      ...(pago ? { pagoPendienteId: pago.id } : {}),
    };
    const validacion = esquemaMovimiento.safeParse(datos);

    if (!validacion.success) {
      setError(MENSAJES.DATOS_INVALIDOS);
      return;
    }

    setCargando(true);
    try {
      const respuesta = await fetch('/api/hogar/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validacion.data),
      });
      const cuerpo = (await respuesta.json()) as RespuestaApi;

      if (!respuesta.ok) {
        const saldoDisponible = saldoDisponibleDesde(cuerpo.error?.detalles);
        const mensaje = cuerpo.error?.mensaje ?? MENSAJES.ERROR_INTERNO;
        setError(
          cuerpo.error?.codigo === 'SALDO_INSUFICIENTE' && saldoDisponible !== null
            ? `${mensaje} Saldo disponible: ${formatearPesos(saldoDisponible)}.`
            : mensaje,
        );
        return;
      }

      if (!cuerpo.datos) {
        setError('El servidor no devolvió el resultado del movimiento.');
        return;
      }
      setResultado(cuerpo.datos);
    } catch {
      setError('No se pudo conectar. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  const montoNumero = Number(monto);
  const saldoEstimado =
    tipo === 'gasto' && Number.isFinite(montoNumero) && montoNumero > 0
      ? saldo.saldo - montoNumero
      : null;

  return (
    <form className="movimiento-formulario" noValidate onSubmit={registrar}>
      <Selector
        etiqueta="Tipo de movimiento"
        id="tipo-movimiento"
        name="tipo"
        onChange={(event) => seleccionarTipo(event.target.value)}
        opciones={[
          { valor: 'ingreso', etiqueta: 'Ingreso' },
          { valor: 'gasto', etiqueta: 'Gasto' },
        ]}
        value={tipo}
      />
      <Selector
        etiqueta="Miembro"
        id="miembro-movimiento"
        marcador="Selecciona un miembro"
        name="miembroId"
        onChange={(event) => setMiembroId(event.target.value)}
        opciones={miembros.map((miembro) => ({ valor: miembro.id, etiqueta: miembro.nombre }))}
        required
        value={miembroId}
      />
      <Selector
        etiqueta="Categoría"
        id="categoria-movimiento"
        marcador="Selecciona una categoría"
        name="categoriaId"
        onChange={(event) => setCategoriaId(event.target.value)}
        opciones={categorias.map((categoria) => ({
          valor: categoria.id,
          etiqueta: categoria.nombre,
        }))}
        required
        value={categoriaId}
      />
      <Campo
        etiqueta="Monto"
        id="monto-movimiento"
        min={1}
        name="monto"
        onChange={(event) => setMonto(event.target.value)}
        required
        step={1}
        type="number"
        value={monto}
        disabled={tipo === 'gasto' && pago !== null && !pago.abonable}
      />
      <Campo
        etiqueta="Fecha"
        id="fecha-movimiento"
        name="fecha"
        onChange={(event) => setFecha(event.target.value)}
        required
        type="date"
        value={fecha}
      />

      {tipo === 'gasto' && (
        <div className="movimiento-formulario__opciones">
          <label>
            <input
              checked={esHormiga}
              name="esHormiga"
              onChange={(event) => setEsHormiga(event.target.checked)}
              type="checkbox"
            />
            <span>Gasto hormiga</span>
          </label>
          <SelectorPago onChange={cambiarPago} pagoId={pago?.id ?? ''} />
        </div>
      )}

      {tipo === 'gasto' && pago && !pago.abonable && (
        <Aviso className="movimiento-formulario__aviso" tipo="info">
          Este pago no admite abonos parciales. Se registrará por su monto restante de{' '}
          {formatearPesos(pago.restante)} y quedará saldado.
        </Aviso>
      )}
      {saldoEstimado !== null && (
        <Aviso
          className="movimiento-formulario__aviso"
          tipo={saldoEstimado < 0 ? 'advertencia' : 'info'}
        >
          Saldo disponible del mes: {formatearPesos(saldo.saldo)}. Este gasto lo dejaría en{' '}
          {formatearPesos(saldoEstimado)}.
        </Aviso>
      )}
      {error && (
        <Aviso className="movimiento-formulario__aviso" tipo="error">
          {error}
        </Aviso>
      )}
      {resultado && (
        <Aviso className="movimiento-formulario__aviso" tipo="exito">
          Movimiento registrado. Nuevo saldo disponible: {formatearPesos(resultado.saldo.saldo)}.
          {resultado.estadoPago === 'pagado' && ' El pago asociado quedó saldado.'} Abriendo
          movimientos…
        </Aviso>
      )}
      <div className="movimiento-formulario__acciones">
        <Boton cargando={cargando} disabled={resultado !== null} type="submit">
          Registrar movimiento
        </Boton>
      </div>
    </form>
  );
}

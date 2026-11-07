import { execFileSync } from 'node:child_process';
import {
  cerrarPool,
  crearCategoria,
  crearMiembro,
  crearPago,
  obtenerAlertasVencimiento,
  registrarMovimiento,
} from '@/lib/dataService';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { hoyBogota } from '@/lib/reglas/fechas';

function sumarDias(fecha: string, dias: number): string {
  const resultado = new Date(`${fecha}T00:00:00.000Z`);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado.toISOString().slice(0, 10);
}

function limpiarDemo(): void {
  execFileSync(process.execPath, ['scripts/limpiar-prueba.mjs', '--demo'], {
    stdio: 'inherit',
  });
}

async function cargarDemo(): Promise<void> {
  limpiarDemo();
  const fecha = hoyBogota();
  const [ana, luis] = await Promise.all([crearMiembro('Demo Ana'), crearMiembro('Demo Luis')]);
  const [mercado, servicios, transporte] = await Promise.all([
    crearCategoria({ nombre: 'Demo Mercado', limiteMensual: 500_000 }),
    crearCategoria({ nombre: 'Demo Servicios', limiteMensual: 300_000 }),
    crearCategoria({ nombre: 'Demo Transporte', limiteMensual: 200_000 }),
  ]);

  await registrarMovimiento(
    {
      miembroId: ana.id,
      categoriaId: mercado.id,
      tipo: 'ingreso',
      monto: 3_000_000,
      fecha,
    },
    'carga-demo',
  );
  await Promise.all([
    registrarMovimiento(
      {
        miembroId: ana.id,
        categoriaId: mercado.id,
        tipo: 'gasto',
        monto: 420_000,
        fecha,
      },
      'carga-demo',
    ),
    registrarMovimiento(
      {
        miembroId: luis.id,
        categoriaId: servicios.id,
        tipo: 'gasto',
        monto: 185_000,
        fecha,
      },
      'carga-demo',
    ),
    registrarMovimiento(
      {
        miembroId: luis.id,
        categoriaId: transporte.id,
        tipo: 'gasto',
        monto: 42_000,
        fecha,
        esHormiga: true,
      },
      'carga-demo',
    ),
  ]);

  await crearPago({
    nombre: 'Demo Servicio de internet',
    monto: 120_000,
    fechaLimite: sumarDias(fecha, 1),
    recurrente: true,
    abonable: false,
  });
  await crearPago({
    nombre: 'Demo Cuota de administración',
    monto: 380_000,
    fechaLimite: sumarDias(fecha, 5),
    recurrente: true,
    abonable: false,
  });

  let pagoVencidoCreado = false;
  try {
    await crearPago({
      nombre: 'Demo Pago con fecha vencida',
      monto: 75_000,
      fechaLimite: sumarDias(fecha, -1),
      recurrente: false,
      abonable: false,
    });
    pagoVencidoCreado = true;
  } catch (error) {
    if (!(error instanceof ErrorDeNegocio) || error.codigo !== 'FECHA_NO_FUTURA') {
      throw error;
    }
  }

  if (!pagoVencidoCreado) {
    await crearPago({
      nombre: 'Demo Pago de reemplazo',
      monto: 75_000,
      fechaLimite: sumarDias(fecha, 1),
      recurrente: false,
      abonable: false,
    });
    console.info(
      'Nota: la regla FECHA_NO_FUTURA impidió crear un pago vencido; se creó el tercer pago a 1 día.',
    );
  }

  const alertas = (await obtenerAlertasVencimiento())
    .filter((alerta) => alerta.nombre.startsWith('Demo'))
    .map((alerta) => ({
      pago: alerta.nombre,
      fechaLimite: alerta.fechaLimite,
      restante: alerta.restante,
      urgencia: alerta.nivelUrgencia,
    }));
  console.table(alertas);
}

cargarDemo()
  .catch((error) => {
    console.error('No se pudo cargar el conjunto de datos demo.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await cerrarPool();
    } catch (error) {
      console.error('No se pudo cerrar el pool de PostgreSQL.', error);
      process.exitCode = 1;
    }
  });

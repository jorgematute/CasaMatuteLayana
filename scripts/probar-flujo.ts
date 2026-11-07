import { execFileSync } from 'node:child_process';
import {
  cerrarPool,
  calcularSaldo,
  crearCategoria,
  crearMiembro,
  crearPago,
  eliminarPago,
  listarPagos,
  obtenerAlertasVencimiento,
  registrarMovimiento,
} from '@/lib/dataService';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { hoyBogota } from '@/lib/reglas/fechas';

let fallas = 0;
let miembroId: string | undefined;
let categoriaId: string | undefined;
let pagoArriendoId: string | undefined;
let pagoTarjetaId: string | undefined;

function asegurar(condicion: boolean, mensaje: string): asserts condicion {
  if (!condicion) {
    throw new Error(mensaje);
  }
}

function sumarDias(fecha: string, dias: number): string {
  const resultado = new Date(`${fecha}T00:00:00.000Z`);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado.toISOString().slice(0, 10);
}

function exigirId(valor: string | undefined, nombre: string): string {
  if (!valor) {
    throw new Error(`No se creó ${nombre} en el paso anterior.`);
  }
  return valor;
}

async function esperarCodigo(codigo: string, trabajo: () => Promise<unknown>): Promise<void> {
  try {
    await trabajo();
  } catch (error) {
    if (error instanceof ErrorDeNegocio && error.codigo === codigo) {
      return;
    }
    throw error;
  }
  throw new Error(`Se esperaba el error ${codigo}.`);
}

async function ejecutarPaso(numero: number, nombre: string, trabajo: () => Promise<void>) {
  try {
    await trabajo();
    console.log(`OK - Paso ${numero}: ${nombre}`);
  } catch (error) {
    fallas += 1;
    console.error(`FALLA - Paso ${numero}: ${nombre}`, error);
  }
}

function limpiarPruebas(): void {
  execFileSync(process.execPath, ['scripts/limpiar-prueba.mjs', '--prueba'], {
    stdio: 'inherit',
  });
}

async function ejecutarFlujo(): Promise<void> {
  await ejecutarPaso(1, 'crear miembro y categoría', async () => {
    const miembro = await crearMiembro('Prueba Ana');
    const categoria = await crearCategoria({
      nombre: 'Prueba Mercado',
      limiteMensual: 500_000,
    });
    miembroId = miembro.id;
    categoriaId = categoria.id;
  });

  await ejecutarPaso(2, 'registrar ingreso y comprobar saldo de $1.000.000', async () => {
    const resultado = await registrarMovimiento(
      {
        miembroId: exigirId(miembroId, 'el miembro'),
        categoriaId: exigirId(categoriaId, 'la categoría'),
        tipo: 'ingreso',
        monto: 1_000_000,
        fecha: hoyBogota(),
      },
      'prueba-flujo',
    );
    asegurar(resultado.saldo.saldo === 1_000_000, 'El saldo debía ser $1.000.000.');
  });

  await ejecutarPaso(3, 'registrar gasto y comprobar saldo de $700.000', async () => {
    const resultado = await registrarMovimiento(
      {
        miembroId: exigirId(miembroId, 'el miembro'),
        categoriaId: exigirId(categoriaId, 'la categoría'),
        tipo: 'gasto',
        monto: 300_000,
        fecha: hoyBogota(),
      },
      'prueba-flujo',
    );
    asegurar(resultado.saldo.saldo === 700_000, 'El saldo debía ser $700.000.');
  });

  await ejecutarPaso(4, 'rechazar gasto mayor al saldo', async () => {
    await esperarCodigo('SALDO_INSUFICIENTE', () =>
      registrarMovimiento(
        {
          miembroId: exigirId(miembroId, 'el miembro'),
          categoriaId: exigirId(categoriaId, 'la categoría'),
          tipo: 'gasto',
          monto: 800_000,
          fecha: hoyBogota(),
        },
        'prueba-flujo',
      ),
    );
    asegurar((await calcularSaldo()).saldo === 700_000, 'El saldo cambió tras el rechazo.');
  });

  await ejecutarPaso(5, 'crear pago no abonable pendiente', async () => {
    const pago = await crearPago({
      nombre: 'Prueba Arriendo',
      monto: 700_000,
      fechaLimite: sumarDias(hoyBogota(), 5),
      recurrente: false,
      abonable: false,
    });
    pagoArriendoId = pago.id;
    const fila = (await listarPagos({ estado: 'pendiente' })).find((item) => item.id === pago.id);
    asegurar(fila?.estado === 'pendiente', 'El pago no quedó pendiente.');
  });

  await ejecutarPaso(6, 'clasificar el pago a cinco días como amarillo', async () => {
    const alerta = (await obtenerAlertasVencimiento()).find(
      (item) => item.id === exigirId(pagoArriendoId, 'el pago de arriendo'),
    );
    asegurar(alerta?.nivelUrgencia === 'amarillo', 'El pago debía estar en nivel amarillo.');
  });

  await ejecutarPaso(7, 'saldar el pago no abonable por su restante', async () => {
    const resultado = await registrarMovimiento(
      {
        miembroId: exigirId(miembroId, 'el miembro'),
        categoriaId: exigirId(categoriaId, 'la categoría'),
        tipo: 'gasto',
        monto: 1,
        fecha: hoyBogota(),
        pagoPendienteId: exigirId(pagoArriendoId, 'el pago de arriendo'),
      },
      'prueba-flujo',
    );
    asegurar(resultado.movimiento.monto === 700_000, 'El monto no se ajustó al restante.');
    asegurar(resultado.estadoPago === 'pagado', 'El pago no quedó saldado.');
    asegurar(resultado.saldo.saldo === 0, 'El saldo final debía ser $0.');
  });

  await ejecutarPaso(8, 'rechazar gasto con saldo cero', async () => {
    await esperarCodigo('SALDO_INSUFICIENTE', () =>
      registrarMovimiento(
        {
          miembroId: exigirId(miembroId, 'el miembro'),
          categoriaId: exigirId(categoriaId, 'la categoría'),
          tipo: 'gasto',
          monto: 1,
          fecha: hoyBogota(),
        },
        'prueba-flujo',
      ),
    );
  });

  await ejecutarPaso(9, 'crear pago abonable', async () => {
    const pago = await crearPago({
      nombre: 'Prueba Tarjeta',
      monto: 300_000,
      fechaLimite: sumarDias(hoyBogota(), 20),
      recurrente: false,
      abonable: true,
    });
    pagoTarjetaId = pago.id;
  });

  await ejecutarPaso(10, 'abonar la mitad y conservar el restante', async () => {
    await registrarMovimiento(
      {
        miembroId: exigirId(miembroId, 'el miembro'),
        categoriaId: exigirId(categoriaId, 'la categoría'),
        tipo: 'ingreso',
        monto: 300_000,
        fecha: hoyBogota(),
      },
      'prueba-flujo',
    );
    const pagoId = exigirId(pagoTarjetaId, 'el pago de tarjeta');
    const abono = {
      miembroId: exigirId(miembroId, 'el miembro'),
      categoriaId: exigirId(categoriaId, 'la categoría'),
      tipo: 'gasto' as const,
      monto: 150_000,
      fecha: hoyBogota(),
      pagoPendienteId: pagoId,
    };
    const resultado = await registrarMovimiento(abono, 'prueba-flujo');
    const pago = (await listarPagos({ estado: 'pendiente' })).find((item) => item.id === pagoId);
    asegurar(resultado.estadoPago === 'pendiente', 'El pago debía seguir pendiente.');
    asegurar(pago?.restante === 150_000, 'El restante debía ser $150.000.');
  });

  await ejecutarPaso(11, 'completar el abono y saldar el pago', async () => {
    const resultado = await registrarMovimiento(
      {
        miembroId: exigirId(miembroId, 'el miembro'),
        categoriaId: exigirId(categoriaId, 'la categoría'),
        tipo: 'gasto',
        monto: 150_000,
        fecha: hoyBogota(),
        pagoPendienteId: exigirId(pagoTarjetaId, 'el pago de tarjeta'),
      },
      'prueba-flujo',
    );
    asegurar(resultado.estadoPago === 'pagado', 'El pago no se marcó como pagado.');
  });

  await ejecutarPaso(12, 'rechazar abono a un pago ya pagado', async () => {
    await esperarCodigo('PAGO_YA_PAGADO', () =>
      registrarMovimiento(
        {
          miembroId: exigirId(miembroId, 'el miembro'),
          categoriaId: exigirId(categoriaId, 'la categoría'),
          tipo: 'gasto',
          monto: 1,
          fecha: hoyBogota(),
          pagoPendienteId: exigirId(pagoTarjetaId, 'el pago de tarjeta'),
        },
        'prueba-flujo',
      ),
    );
  });

  await ejecutarPaso(13, 'impedir eliminar un pago con movimiento', async () => {
    await esperarCodigo('PAGO_NO_ELIMINABLE', () =>
      eliminarPago(exigirId(pagoArriendoId, 'el pago de arriendo')),
    );
  });

  await ejecutarPaso(14, 'eliminar un pago pendiente sin movimientos', async () => {
    const pago = await crearPago({
      nombre: 'Prueba Vacío',
      monto: 50_000,
      fechaLimite: sumarDias(hoyBogota(), 10),
      recurrente: false,
      abonable: false,
    });
    await eliminarPago(pago.id);
    asegurar(!(await listarPagos()).some((item) => item.id === pago.id), 'El pago sigue listado.');
  });
}

async function main(): Promise<void> {
  try {
    limpiarPruebas();
    await ejecutarFlujo();
  } catch (error) {
    fallas += 1;
    console.error('FALLA - No se pudo ejecutar el flujo contra la base real.', error);
  } finally {
    try {
      limpiarPruebas();
    } catch (error) {
      fallas += 1;
      console.error('FALLA - No se pudieron limpiar los datos de prueba al finalizar.', error);
    }

    try {
      await cerrarPool();
    } catch (error) {
      fallas += 1;
      console.error('FALLA - No se pudo cerrar el pool de PostgreSQL.', error);
    }
  }

  console.log(`Resultado de probar:flujo: ${fallas === 0 ? '0 fallas' : `${fallas} fallas`}.`);
  if (fallas > 0) {
    process.exitCode = 1;
  }
}

void main();

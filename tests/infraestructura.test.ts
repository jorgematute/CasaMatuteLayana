import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatearDiasRestantes, formatearPesos } from '@/lib/formato';
import { responderError, responderOk } from '@/lib/http/respuestas';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { esquemaMovimiento } from '@/lib/validacion/esquemas';
import { z } from 'zod';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('respuestas HTTP', () => {
  it('responde exitosamente y evita cachear', async () => {
    const respuesta = responderOk({ email: 'miembro@example.com' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers.get('Cache-Control')).toBe('no-store');
    await expect(respuesta.json()).resolves.toEqual({
      ok: true,
      datos: { email: 'miembro@example.com' },
    });
  });

  it('usa el estado HTTP de los errores de negocio', async () => {
    const respuesta = responderError(new ErrorDeNegocio('NO_AUTORIZADO'));

    expect(respuesta.status).toBe(401);
    await expect(respuesta.json()).resolves.toMatchObject({
      ok: false,
      error: { codigo: 'NO_AUTORIZADO' },
    });
  });

  it('aplana los detalles de errores Zod', async () => {
    const error = z.object({ nombre: z.string() }).safeParse({ nombre: 3 });
    if (error.success) throw new Error('Se esperaba que el esquema rechazara nombre numérico.');

    const respuesta = responderError(error.error);

    expect(respuesta.status).toBe(400);
    await expect(respuesta.json()).resolves.toMatchObject({
      ok: false,
      error: {
        codigo: 'DATOS_INVALIDOS',
        detalles: { fieldErrors: { nombre: expect.any(Array) } },
      },
    });
  });

  it('traduce el nombre duplicado según la restricción PostgreSQL', async () => {
    const respuesta = responderError({
      code: '23505',
      constraint: 'ux_miembros_nombre',
    });

    expect(respuesta.status).toBe(409);
    await expect(respuesta.json()).resolves.toMatchObject({
      error: { codigo: 'NOMBRE_DUPLICADO' },
    });
  });

  it('registra y oculta los errores inesperados', async () => {
    const registrarError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const respuesta = responderError(new Error('detalle interno'));

    expect(respuesta.status).toBe(500);
    expect(registrarError).toHaveBeenCalledOnce();
    await expect(respuesta.json()).resolves.toMatchObject({
      error: { codigo: 'ERROR_INTERNO' },
    });
  });
});

describe('esquema de movimiento', () => {
  const movimiento = {
    miembroId: '00000000-0000-4000-8000-000000000001',
    categoriaId: '00000000-0000-4000-8000-000000000002',
    tipo: 'ingreso',
    monto: 1000,
    fecha: '2026-10-31',
  };

  it('rechaza marcar un ingreso como hormiga o asociarlo a un pago', () => {
    expect(esquemaMovimiento.safeParse({ ...movimiento, esHormiga: true }).success).toBe(false);
    expect(
      esquemaMovimiento.safeParse({
        ...movimiento,
        pagoPendienteId: '00000000-0000-4000-8000-000000000003',
      }).success,
    ).toBe(false);
  });

  it('acepta fecha válida y rechaza fechas inexistentes', () => {
    expect(esquemaMovimiento.safeParse(movimiento).success).toBe(true);
    expect(esquemaMovimiento.safeParse({ ...movimiento, fecha: '2026-02-30' }).success).toBe(false);
  });
});

describe('formato de presentación', () => {
  it('formatea días restantes en singular y plural', () => {
    expect(formatearDiasRestantes(0)).toBe('Vence hoy');
    expect(formatearDiasRestantes(1)).toBe('Falta 1 día');
    expect(formatearDiasRestantes(5)).toBe('Faltan 5 días');
    expect(formatearDiasRestantes(-3)).toBe('Venció hace 3 días');
  });

  it('formatea pesos colombianos sin centavos', () => {
    expect(formatearPesos(1250)).toContain('1.250');
    expect(formatearPesos(1250)).not.toMatch(/,\d/);
  });
});

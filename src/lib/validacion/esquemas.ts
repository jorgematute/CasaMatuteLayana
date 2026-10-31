import { z } from 'zod';

const esquemaFecha = z.iso.date();
const esquemaNombre = (maximo: number) => z.string().min(2).max(maximo);

export const esquemaMovimiento = z
  .object({
    miembroId: z.uuid(),
    categoriaId: z.uuid(),
    tipo: z.enum(['ingreso', 'gasto']),
    monto: z.number().int().min(1),
    fecha: esquemaFecha,
    esHormiga: z.boolean().optional(),
    pagoPendienteId: z.uuid().optional(),
  })
  .refine(
    (movimiento) =>
      movimiento.tipo !== 'ingreso' ||
      (movimiento.esHormiga !== true && movimiento.pagoPendienteId === undefined),
    { message: 'Un ingreso no puede ser hormiga ni estar asociado a un pago.', path: ['tipo'] },
  );

export const esquemaPago = z.object({
  nombre: esquemaNombre(120),
  monto: z.number().int().min(1),
  fechaLimite: esquemaFecha,
  recurrente: z.boolean(),
  abonable: z.boolean(),
});

export const esquemaMiembro = z.object({
  nombre: esquemaNombre(80),
});

export const esquemaCategoria = z.object({
  nombre: esquemaNombre(80),
  limiteMensual: z.number().int().min(1).nullable(),
});

export const esquemaCambiosMiembro = z
  .object({
    nombre: esquemaNombre(80).optional(),
    activo: z.boolean().optional(),
  })
  .refine((cambios) => Object.keys(cambios).length > 0, {
    message: 'Debe indicar al menos un cambio.',
  });

export const esquemaCambiosCategoria = z
  .object({
    nombre: esquemaNombre(80).optional(),
    limiteMensual: z.number().int().min(1).nullable().optional(),
    activo: z.boolean().optional(),
  })
  .refine((cambios) => Object.keys(cambios).length > 0, {
    message: 'Debe indicar al menos un cambio.',
  });

export const esquemaFiltrosMovimientos = z.object({
  miembroId: z.uuid().optional(),
  categoriaId: z.uuid().optional(),
  desde: esquemaFecha.optional(),
  hasta: esquemaFecha.optional(),
});

export const esquemaFiltrosResumen = z.object({
  desde: esquemaFecha,
  hasta: esquemaFecha,
  miembroId: z.uuid().optional(),
  categoriaId: z.uuid().optional(),
});

export type Movimiento = z.infer<typeof esquemaMovimiento>;
export type Pago = z.infer<typeof esquemaPago>;
export type Miembro = z.infer<typeof esquemaMiembro>;
export type Categoria = z.infer<typeof esquemaCategoria>;
export type CambiosMiembro = z.infer<typeof esquemaCambiosMiembro>;
export type CambiosCategoria = z.infer<typeof esquemaCambiosCategoria>;
export type FiltrosMovimientos = z.infer<typeof esquemaFiltrosMovimientos>;
export type FiltrosResumen = z.infer<typeof esquemaFiltrosResumen>;

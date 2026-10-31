export type CodigoError =
  | 'DATOS_INVALIDOS'
  | 'NO_AUTORIZADO'
  | 'MIEMBRO_INVALIDO'
  | 'CATEGORIA_INVALIDA'
  | 'NOMBRE_DUPLICADO'
  | 'TIENE_MOVIMIENTOS'
  | 'FECHA_NO_FUTURA'
  | 'PAGO_NO_ENCONTRADO'
  | 'PAGO_YA_PAGADO'
  | 'PAGO_NO_ELIMINABLE'
  | 'MONTO_NO_EDITABLE'
  | 'MONTO_EXCEDE_RESTANTE'
  | 'SALDO_INSUFICIENTE'
  | 'ERROR_INTERNO';

export const MENSAJES: Record<CodigoError, string> = {
  DATOS_INVALIDOS: 'Revise los datos ingresados.',
  NO_AUTORIZADO: 'Debe iniciar sesión.',
  MIEMBRO_INVALIDO: 'El miembro seleccionado no existe o está inactivo.',
  CATEGORIA_INVALIDA: 'La categoría seleccionada no existe o está inactiva.',
  NOMBRE_DUPLICADO: 'Ya existe un registro con ese nombre.',
  TIENE_MOVIMIENTOS: 'No se puede eliminar: tiene movimientos asociados.',
  FECHA_NO_FUTURA: 'La fecha límite debe ser una fecha futura.',
  PAGO_NO_ENCONTRADO: 'El pago no existe.',
  PAGO_YA_PAGADO: 'Este pago ya está saldado.',
  PAGO_NO_ELIMINABLE: 'Solo se puede eliminar un pago pendiente sin movimientos.',
  MONTO_NO_EDITABLE: 'El monto de un pago no abonable no se puede modificar.',
  MONTO_EXCEDE_RESTANTE: 'El abono no puede superar el monto restante del pago.',
  SALDO_INSUFICIENTE: 'El gasto dejaría el saldo del hogar en negativo.',
  ERROR_INTERNO: 'Ocurrió un error inesperado. Intente de nuevo.',
};

export const ESTADO_HTTP: Record<CodigoError, number> = {
  DATOS_INVALIDOS: 400,
  NO_AUTORIZADO: 401,
  MIEMBRO_INVALIDO: 422,
  CATEGORIA_INVALIDA: 422,
  NOMBRE_DUPLICADO: 409,
  TIENE_MOVIMIENTOS: 409,
  FECHA_NO_FUTURA: 422,
  PAGO_NO_ENCONTRADO: 404,
  PAGO_YA_PAGADO: 409,
  PAGO_NO_ELIMINABLE: 409,
  MONTO_NO_EDITABLE: 422,
  MONTO_EXCEDE_RESTANTE: 422,
  SALDO_INSUFICIENTE: 409,
  ERROR_INTERNO: 500,
};

function completarMensaje(mensaje: string, detalles: unknown): string {
  if (typeof detalles !== 'object' || detalles === null) {
    return mensaje;
  }

  return mensaje.replace(/\{(\w+)\}/g, (coincidencia, clave: string) => {
    if (!(clave in detalles)) {
      return coincidencia;
    }

    return String((detalles as Record<string, unknown>)[clave]);
  });
}

export class ErrorDeNegocio extends Error {
  constructor(
    public codigo: CodigoError,
    mensaje?: string,
    public detalles?: unknown,
  ) {
    super(mensaje ?? completarMensaje(MENSAJES[codigo], detalles));
    this.name = 'ErrorDeNegocio';
  }
}

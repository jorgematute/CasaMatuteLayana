// Umbrales ajustables sin tocar la lógica (RNF5).

export const ZONA_HORARIA = 'America/Bogota';

// Urgencia de pagos (días restantes). Ver sección 5.2.
export const DIAS_VERDE_MINIMO = 8;        // 8 o más → verde
export const DIAS_AMARILLO_MINIMO = 3;     // 3 a 7 → amarillo
// 2 o menos → rojo; negativo → vencido

// Categoría (porcentaje del límite mensual). Ver sección 5.3.
export const PORCENTAJE_CATEGORIA_AMARILLO = 90;   // desde 90 % → amarillo
export const PORCENTAJE_CATEGORIA_ROJO = 100;      // desde 100 % → rojo

// Gastos hormiga.
export const UMBRAL_HORMIGA = 100_000;     // pesos; al alcanzarlo, aviso

export const LIMITE_LISTADO = 500;         // filas máximas por consulta

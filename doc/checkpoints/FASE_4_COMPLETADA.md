# Fase 4 completada · Datos y API mínima

## P04 · Datos

- `npm run probar:flujo`: pasos 1 a 14 en `OK`; resultado con 0 fallas. Incluye registro de ingreso y gasto, rechazo de gasto superior al saldo, pagos y abonos.
- `npm run db:demo`: correcto. Se cargaron dos miembros, tres categorías, un ingreso, tres gastos y tres pagos de demostración.
- Salida y detalles de conexión registrados en la bitácora de [ESTADO_EJECUCION.md](../ESTADO_EJECUCION.md).

## P05 · API del módulo mínimo

- Rutas implementadas: panel; consulta y registro de movimientos; consulta, creación y eliminación de pagos; consulta y creación de miembros y categorías; actualización de miembros y categorías.
- Todas exigen sesión, validan cuerpos y filtros, usan `Cache-Control: no-store` en sus respuestas y se ejecutan dinámicamente. Los endpoints opcionales de saldo y resumen no se añadieron.
- GET `/api/hogar/panel` y GET `/api/hogar/pagos` sin sesión devolvieron 401 `NO_AUTORIZADO`. POST `/api/hogar/movimientos` sin sesión también devolvió 401.
- Filtros inválidos de estado de pago, `incluirInactivos` y fecha devolvieron 400 `DATOS_INVALIDOS`.
- Con sesión y los datos DEMO, GET `/api/hogar/panel` respondió 200 con tres alertas: dos rojas y una amarilla. El desglose de saldo fue ingresos $3.000.000, gastos $647.000, pagos pendientes del mes $575.000 y saldo disponible $1.778.000.
- GET `/api/hogar/pagos` respondió 200 con los tres pagos pendientes DEMO: Demo Pago de reemplazo, Demo Servicio de internet y Demo Cuota de administración.
- POST `/api/hogar/movimientos` con un gasto de $1.778.001, un peso por encima del saldo disponible, respondió 409 `SALDO_INSUFICIENTE` y reportó `saldoDisponible: 1778000`. El gasto fue rechazado.

## Validación final

- `npm run build`: correcto.
- `npm test`: correcto, 7 archivos y 48 pruebas.
- `npm run type-check`: correcto.
- Prettier: correcto.

La primera ejecución autenticada de desarrollo no tenía `NODE_EXTRA_CA_CERTS` y mostró `SELF_SIGNED_CERT_IN_CHAIN`. Se reinició el servidor con el certificado local ya configurado; la validación del certificado TLS permaneció activa y las verificaciones anteriores finalizaron correctamente.

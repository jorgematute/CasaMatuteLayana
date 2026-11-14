# Fase 5 completada · Interfaz de movimientos

- Se implementó el registro de ingresos y gastos en `/hogar/movimientos/nuevo`, usando miembros y categorías activos y validando en el navegador con `esquemaMovimiento`.
- Para gastos, el formulario permite marcar gasto hormiga y seleccionar un pago pendiente. En pagos no abonables completa y bloquea el restante; en abonables permite editar el monto y muestra el restante como referencia.
- Antes de guardar un gasto, presenta el saldo mensual y el saldo estimado. El servidor conserva la decisión definitiva y, si rechaza por saldo insuficiente, la interfaz muestra el saldo disponible devuelto por la API.
- La lista `/hogar/movimientos` muestra fecha, miembro, categoría, tipo, monto, gasto hormiga y pago vinculado; permite filtrar por miembro, categoría y rango de fechas. Ordena por fecha descendente y presenta estado vacío.
- Las páginas son dinámicas; las operaciones usan la API existente protegida por sesión. Los estilos añadidos conservan el formato y los componentes de interfaz del proyecto, con ajustes móviles.
- Verificación: `npm run type-check` correcto y `npm run build` correcto (2026-11-14).

La verificación autenticada en Vercel se registra en [ACEPTACION.md](../ACEPTACION.md): A-01 a A-12 y A-18 siguen pendientes de ejecución.

# US-32 — [Stress] Tests de stress de operaciones y portfolio

> *(Para más adelante)*
>
> Como equipo, queremos verificar que los endpoints de compra, venta y
> consulta de portfolio soportan carga concurrente sin inconsistencias.

**Criterios de aceptación:**
- Se ejecutan tests de stress sobre los endpoints de compra, venta, historial, portfolio y P&L.
- El sistema soporta al menos 50 usuarios concurrentes con un tiempo de respuesta p95 < 500ms.
- No se producen inconsistencias en las posiciones del portfolio bajo carga concurrente.
- La tasa de error bajo carga no supera el 1%.

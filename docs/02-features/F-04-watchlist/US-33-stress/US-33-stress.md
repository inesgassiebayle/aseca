# US-33 — [Stress] Tests de stress de watchlist

> *(Para más adelante)*
>
> Como equipo, queremos verificar que los endpoints de watchlist y comparación
> soportan carga concurrente sin degradación inaceptable.

**Criterios de aceptación:**
- Se ejecutan tests de stress sobre los endpoints de watchlist y comparación de métricas.
- El sistema soporta al menos 50 usuarios concurrentes con un tiempo de respuesta p95 < 1000ms.
- El cache de EDGAR se valida bajo carga durante la comparación de métricas.
- La tasa de error bajo carga no supera el 1%.

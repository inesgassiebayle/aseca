# US-31 — [Stress] Tests de stress de búsqueda y consulta de empresas

> *(Para más adelante)*
>
> Como equipo, queremos verificar que los endpoints de búsqueda y consulta
> soportan carga concurrente sin degradar ni exceder el rate limit de EDGAR.

**Criterios de aceptación:**
- Se ejecutan tests de stress sobre los endpoints de búsqueda, métricas, filings y evolución.
- El sistema soporta al menos 50 usuarios concurrentes con un tiempo de respuesta p95 < 1000ms.
- El cache de EDGAR se valida bajo carga: no se superan las 10 req/segundo hacia EDGAR.
- La tasa de error bajo carga no supera el 1%.

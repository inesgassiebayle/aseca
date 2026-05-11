# US-30 — [Stress] Tests de stress de registro y login

>
> Como equipo, queremos verificar que los endpoints de registro y login
> soportan carga concurrente sin degradación inaceptable.

**Criterios de aceptación:**
- Se ejecutan tests de stress sobre los endpoints de registro y login.
- El sistema soporta al menos 50 usuarios concurrentes con un tiempo de respuesta p95 < 500ms.
- La tasa de error bajo carga no supera el 1%.

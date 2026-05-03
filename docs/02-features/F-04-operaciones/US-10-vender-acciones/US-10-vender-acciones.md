# US-10 — Vender acciones

> Como usuario, quiero registrar una venta de acciones que poseo,
> al precio vigente almacenado, para reflejar la operación en mi historial.

**Criterios de aceptación:**
- El usuario debe tener suficientes acciones del ticker en su portfolio.
- No se puede vender más de lo que se posee.
- La operación queda registrada con timestamp y precio al momento de la venta.
- El portfolio se actualiza restando la cantidad vendida.
- Si la cantidad vendida iguala la posición, la posición queda en 0 (o se elimina).


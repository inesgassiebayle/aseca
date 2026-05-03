# US-09 — Comprar acciones

> Como usuario, quiero registrar una compra de acciones al precio vigente almacenado,
> para que quede reflejada en mi portfolio e historial.

**Criterios de aceptación:**
- El ticker debe existir y tener precio almacenado en la DB.
- La cantidad debe ser mayor a cero.
- La operación queda registrada con timestamp y precio al momento de la compra.
- El portfolio se actualiza sumando la cantidad comprada.


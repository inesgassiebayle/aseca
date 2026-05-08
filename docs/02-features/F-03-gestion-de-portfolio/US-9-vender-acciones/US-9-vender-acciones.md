# US-9 — Vender acciones

> Como usuario, quiero registrar una venta de acciones,
> para reducir o cerrar una posición en mi portfolio.

**Criterios de aceptación:**
- El usuario indica ticker y cantidad; el sistema usa el precio almacenado más reciente.
- Si el usuario no posee el ticker o la cantidad supera la disponible, la operación es rechazada.
- La operación queda registrada con tipo "venta", ticker, cantidad, precio y timestamp.
- La posición del ticker en el portfolio se reduce en la cantidad vendida.
- Si la posición llega a 0, el ticker desaparece del portfolio.

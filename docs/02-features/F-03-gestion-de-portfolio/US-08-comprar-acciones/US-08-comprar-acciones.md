# US-08 — Comprar acciones

> Como usuario, quiero registrar una compra de acciones,
> para incorporar una posición a mi portfolio.

**Criterios de aceptación:**
- El usuario indica ticker y cantidad; el sistema usa el precio almacenado más reciente.
- Si no existe precio almacenado para el ticker, la operación es rechazada.
- La operación queda registrada con tipo "compra", ticker, cantidad, precio y timestamp.
- La posición del ticker en el portfolio se incrementa en la cantidad comprada.

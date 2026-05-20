# US-08 — Comprar acciones

> Como usuario, quiero registrar una compra de acciones,
> para incorporar una posición a mi portfolio.

**Criterios de aceptación:**
- El usuario indica ticker y cantidad; el sistema usa el precio almacenado más reciente.
- Si el ticker no pertenece a la lista blanca del sistema (y por tanto no tiene precio almacenado), la operación es rechazada.
- La operación queda registrada con tipo "compra", ticker, cantidad, precio y timestamp.
- La posición del ticker en el portfolio se incrementa en la cantidad comprada.

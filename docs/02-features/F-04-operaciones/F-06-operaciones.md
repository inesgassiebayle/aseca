# F-04 — Registro de operaciones

## Descripción

El usuario puede registrar operaciones de **compra y venta** de acciones.
Cada operación se realiza al precio vigente según la última actualización
almacenada en el sistema (nunca en tiempo real).

Cada operación registrada modifica el estado del portfolio (F-05):
una compra incrementa la posición, una venta la reduce.
El sistema mantiene un historial completo e inmutable de todas las transacciones.

> No se puede vender una acción que no se posee, ni vender más unidades
> de las disponibles en el portfolio.

---

## Criterios de aceptación

- Un usuario autenticado puede registrar una compra de acciones si el ticker existe y tiene precio almacenado.
- Un usuario autenticado puede registrar una venta siempre que posea suficientes acciones del ticker.
- No es posible vender más acciones de las disponibles en el portfolio.
- Cada operación queda registrada con ticker, cantidad, precio vigente y timestamp.
- El portfolio se actualiza automáticamente tras cada compra o venta.
- El historial completo de operaciones es consultable ordenado por fecha descendente.
- El historial puede filtrarse por ticker.

---

## User stories

- US-09 — Comprar acciones
- US-10 — Vender acciones
- US-11 — Ver historial de operaciones

---

## Dependencias

- **F-01** — el usuario debe estar autenticado.
- **F-03** — debe existir precio almacenado para el ticker antes de operar.
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

## User stories

- US-09 — Comprar acciones
- US-10 — Vender acciones
- US-11 — Ver historial de operaciones

---

## Dependencias

- **F-01** — el usuario debe estar autenticado.
- **F-03** — debe existir precio almacenado para el ticker antes de operar.
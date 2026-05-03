# F-05 — Gestión de portfolio

## Descripción

El portfolio representa el **estado actual** de la cartera del usuario: qué acciones
posee en este momento, cuántas unidades, y cuánto valen según el último precio
almacenado en el sistema.

El portfolio no se modifica directamente: es el resultado acumulado de todas las
operaciones de compra y venta registradas en F-04. Lo que sí puede hacer el usuario
desde acá es **ver** su cartera completa y el valor actualizado de cada posición.

> El precio actual nunca se consulta en tiempo real a Yahoo Finance. Siempre se
> usa el último precio persistido en la DB por el proceso batch (F-03).

---

## User stories

- US-12 — Ver portfolio
- US-13 — Ver detalle de una posición

---

## Dependencias

- **F-01** — el usuario debe estar autenticado.
- **F-03** — los precios deben estar cargados en la DB para mostrar valor actual.
- **F-04** — las posiciones son el resultado de las operaciones registradas.
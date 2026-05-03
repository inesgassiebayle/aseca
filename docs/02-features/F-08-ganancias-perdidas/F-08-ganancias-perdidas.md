# F-08 — Profit & Loss (P&L)

## Descripción

El sistema calcula la **ganancia o pérdida** de cada posición del portfolio,
comparando el precio de compra original contra el último precio almacenado en la DB.

El P&L se calcula **por compra individual** (cada transacción de compra queda
registrada con su precio de entrada), y también se muestra el P&L agregado
por ticker y el total del portfolio.

> El cálculo nunca usa precios en tiempo real. Siempre se basa en el
> último precio persistido por el proceso batch (F-03).

---

## Fórmulas

```
P&L por posición   = (precio_actual - precio_compra) × cantidad
P&L % por posición = ((precio_actual - precio_compra) / precio_compra) × 100
P&L total portfolio = suma de P&L de todas las posiciones abiertas
```

---

## User stories

- US-19 — Ver P&L por posición
- US-20 — Ver P&L total del portfolio

---

## Dependencias

- **F-01** — el usuario debe estar autenticado.
- **F-03** — el precio actual viene del último batch ejecutado.
- **F-04** — el precio de compra viene de cada operación registrada.
# F-03 — Gestión de portfolio

## Descripción

Agrupa el registro de operaciones, la visualización del portfolio resultante
y el cálculo de ganancias y pérdidas (P&L).

**Operaciones:** el usuario registra compras y ventas de acciones. Cada operación
se ejecuta al precio almacenado en el sistema (nunca en tiempo real). El historial
de operaciones es inmutable.

**Portfolio:** representa el estado actual de la cartera — qué acciones posee el
usuario, cuántas unidades y cuánto valen según el último precio del batch. El
portfolio no se modifica directamente: es el resultado acumulado de las operaciones.

**P&L:** el sistema calcula la ganancia o pérdida de cada posición comparando el
precio de compra original contra el último precio almacenado. Se muestra por
posición y consolidado para todo el portfolio.

> No se puede vender una acción que no se posee, ni más unidades de las disponibles.
> El cálculo de P&L nunca usa precios en tiempo real.

---

## Fórmulas P&L

```
P&L por posición    = (precio_actual - precio_compra) × cantidad
P&L % por posición  = ((precio_actual - precio_compra) / precio_compra) × 100
P&L total portfolio = suma de P&L de todas las posiciones abiertas
```

---

## Alcance de cada US

Cada user story cubre las siguientes capas:
- **Backend:** endpoint/s de la API REST implementados con tests unitarios.
- **Frontend web:** vista o componente implementado con tests de end-to-end (E2E).

---

## User stories

- US-08 — Comprar acciones
- US-09 — Vender acciones
- US-10 — Ver historial de operaciones
- US-11 — Ver portfolio
- US-12 — Ver detalle de una posición
- US-19 — Ver P&L por posición
- US-20 — Ver P&L total del portfolio
- US-28 — [Mobile] Gestión de portfolio desde la app móvil 
- US-32 — [Stress] Tests de stress de operaciones y portfolio

---

## Dependencias

- **F-01** — el usuario debe estar autenticado.
- **F-02** — debe existir precio almacenado para el ticker antes de operar y para calcular P&L.
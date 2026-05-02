# F-05 — Gestión de portfolio

## Descripción

El portfolio representa el **estado actual** de la cartera del usuario: qué acciones
posee en este momento, cuántas unidades, y cuánto valen según el último precio
almacenado en el sistema.

El portfolio no se modifica directamente: es el resultado acumulado de todas las
operaciones de compra y venta registradas en F-03. Lo que sí puede hacer el usuario
desde acá es **ver** su cartera completa y el valor actualizado de cada posición.

> El precio actual nunca se consulta en tiempo real a Yahoo Finance. Siempre se
> usa el último precio persistido en la DB por el proceso batch (F-05).

---

## User stories

### US-11 — Ver portfolio
> Como usuario autenticado, quiero ver el listado de todas mis posiciones actuales
> con su valor y rendimiento, para evaluar el estado de mi cartera.

**Criterios de aceptación:**
- Se muestra cada ticker con: cantidad de acciones, precio de compra promedio,
  precio actual (último almacenado), valor total de la posición y P&L.
- Se muestra la fecha y hora de la última actualización de precios.
- Si no hay posiciones, se muestra un estado vacío.

```gherkin
Feature: Ver portfolio

  Scenario: Usuario con posiciones registradas
    Given que el usuario tiene posiciones en su portfolio
    And el sistema tiene precios actualizados en la DB
    When consulta su portfolio
    Then ve cada ticker con su cantidad, valor actual y P&L
    And ve la fecha y hora de la última actualización de precios

  Scenario: Usuario sin posiciones
    Given que el usuario no tiene posiciones registradas
    When consulta su portfolio
    Then ve un portfolio vacío
    And el sistema sugiere registrar su primera operación
```

---

### US-12 — Ver detalle de una posición
> Como usuario, quiero ver el detalle de una posición específica,
> para analizar el historial de operaciones de ese ticker.

**Criterios de aceptación:**
- Se muestra el ticker, cantidad actual, precio promedio de compra y P&L total.
- Se listan todas las operaciones asociadas a ese ticker (de F-03).

```gherkin
Feature: Detalle de posición

  Scenario: Ver detalle de ticker existente
    Given que el usuario tiene posiciones de "AAPL" en su portfolio
    When consulta el detalle de "AAPL"
    Then ve la cantidad actual, precio promedio y P&L
    And ve el historial de operaciones de "AAPL"

  Scenario: Ticker sin posición
    Given que el usuario no tiene posiciones de "TSLA"
    When consulta el detalle de "TSLA"
    Then el sistema retorna un error 404
```

---

## Dependencias

- **F-01** — el usuario debe estar autenticado.
- **F-03** — las posiciones son el resultado de las operaciones registradas.
- **F-05** — los precios deben estar cargados en la DB para mostrar valor actual.

## Estado

- [ ] User stories refinadas
- [ ] Gherkin escrito
- [ ] En desarrollo
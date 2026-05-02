# F-04 — Profit & Loss (P&L)

## Descripción

El sistema calcula la **ganancia o pérdida** de cada posición del portfolio,
comparando el precio de compra original contra el último precio almacenado en la DB.

El P&L se calcula **por compra individual** (cada transacción de compra queda
registrada con su precio de entrada), y también se muestra el P&L agregado
por ticker y el total del portfolio.

> El cálculo nunca usa precios en tiempo real. Siempre se basa en el
> último precio persistido por el proceso batch (F-05).

---

## Fórmulas

```
P&L por posición  = (precio_actual - precio_compra) × cantidad
P&L % por posición = ((precio_actual - precio_compra) / precio_compra) × 100
P&L total portfolio = suma de P&L de todas las posiciones abiertas
```

---

## User stories

### US-08 — Ver P&L por posición
> Como usuario, quiero ver la ganancia o pérdida de cada posición de mi portfolio,
> para saber cuánto rinde cada acción que tengo.

**Criterios de aceptación:**
- Se muestra P&L en valor absoluto (USD) y porcentual (%) por cada posición.
- Se distingue visualmente ganancia (positivo) de pérdida (negativo).
- El cálculo usa el último precio almacenado en la DB.
- Se muestra la fecha de la última actualización de precios.

```gherkin
Feature: P&L por posición

  Scenario: Posición con ganancia
    Given que el usuario compró 10 acciones de "AAPL" a $150
    And el último precio almacenado de "AAPL" es $180
    When consulta el P&L de su portfolio
    Then ve un P&L de +$300 y +20% para "AAPL"

  Scenario: Posición con pérdida
    Given que el usuario compró 5 acciones de "MSFT" a $420
    And el último precio almacenado de "MSFT" es $390
    When consulta el P&L de su portfolio
    Then ve un P&L de -$150 y -7.14% para "MSFT"

  Scenario: Sin precio actualizado
    Given que el ticker "XYZ" no tiene precio almacenado
    When el usuario consulta el P&L de su posición en "XYZ"
    Then el sistema indica que no hay precio disponible para ese ticker
```

---

### US-09 — Ver P&L total del portfolio
> Como usuario, quiero ver el P&L consolidado de todo mi portfolio,
> para evaluar el rendimiento global de mi inversión.

**Criterios de aceptación:**
- Se muestra el valor total invertido, el valor actual total y el P&L total.
- El P&L total es la suma de todas las posiciones abiertas.

```gherkin
Feature: P&L total del portfolio

  Scenario: Portfolio con múltiples posiciones
    Given que el usuario tiene posiciones en "AAPL", "MSFT" y "GOOGL"
    And todos tienen precios almacenados en la DB
    When consulta el resumen de su portfolio
    Then ve el valor total invertido, el valor actual y el P&L total consolidado
```

---

## Dependencias

- **F-01** — el usuario debe estar autenticado.
- **F-03** — el precio de compra viene de cada operación registrada.
- **F-05** — el precio actual viene del último batch ejecutado.

## Estado

- [ ] User stories refinadas
- [ ] Gherkin escrito
- [ ] En desarrollo
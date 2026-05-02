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

### US-08 — Comprar acciones
> Como usuario, quiero registrar una compra de acciones al precio vigente almacenado,
> para que quede reflejada en mi portfolio e historial.

**Criterios de aceptación:**
- El ticker debe existir y tener precio almacenado en la DB.
- La cantidad debe ser mayor a cero.
- La operación queda registrada con timestamp y precio al momento de la compra.
- El portfolio se actualiza sumando la cantidad comprada.

```gherkin
Feature: Compra de acciones

  Scenario: Compra exitosa
    Given que el usuario está autenticado
    And el ticker "AAPL" tiene precio almacenado en la DB
    When registra una compra de 10 acciones de "AAPL"
    Then la operación queda registrada con el precio vigente y timestamp
    And el portfolio refleja 10 acciones más de "AAPL"

  Scenario: Ticker sin precio en la DB
    Given que el ticker "XYZ" no tiene precio almacenado
    When el usuario intenta comprar acciones de "XYZ"
    Then el sistema retorna un error indicando que no hay precio disponible

  Scenario: Cantidad inválida
    Given que el usuario está autenticado
    When intenta comprar 0 o una cantidad negativa de acciones
    Then el sistema retorna un error de validación
```

---

### US-09 — Vender acciones
> Como usuario, quiero registrar una venta de acciones que poseo,
> al precio vigente almacenado, para reflejar la operación en mi historial.

**Criterios de aceptación:**
- El usuario debe tener suficientes acciones del ticker en su portfolio.
- No se puede vender más de lo que se posee.
- La operación queda registrada con timestamp y precio al momento de la venta.
- El portfolio se actualiza restando la cantidad vendida.
- Si la cantidad vendida iguala la posición, la posición queda en 0 (o se elimina).

```gherkin
Feature: Venta de acciones

  Scenario: Venta exitosa
    Given que el usuario tiene 15 acciones de "AAPL" en su portfolio
    And "AAPL" tiene precio almacenado en la DB
    When registra una venta de 5 acciones de "AAPL"
    Then la operación queda registrada con el precio vigente y timestamp
    And el portfolio refleja 10 acciones de "AAPL"

  Scenario: Venta sin posición suficiente
    Given que el usuario tiene 3 acciones de "MSFT"
    When intenta vender 10 acciones de "MSFT"
    Then el sistema retorna un error indicando saldo insuficiente

  Scenario: Venta de acción no poseída
    Given que el usuario no tiene acciones de "TSLA"
    When intenta vender acciones de "TSLA"
    Then el sistema retorna un error indicando que no posee ese ticker
```

---

### US-10 — Ver historial de operaciones
> Como usuario, quiero ver el historial completo de mis transacciones,
> para hacer seguimiento de todas mis operaciones pasadas.

**Criterios de aceptación:**
- Se listan todas las operaciones ordenadas por fecha descendente.
- Cada entrada muestra: tipo (compra/venta), ticker, cantidad, precio y fecha.
- Se puede filtrar por ticker.

```gherkin
Feature: Historial de operaciones

  Scenario: Ver historial completo
    Given que el usuario tiene operaciones registradas
    When consulta su historial
    Then ve todas las operaciones ordenadas por fecha descendente
    And cada operación muestra tipo, ticker, cantidad, precio y timestamp

  Scenario: Historial vacío
    Given que el usuario no tiene operaciones registradas
    When consulta su historial
    Then ve un historial vacío
```

---

## Dependencias

- **F-01** — el usuario debe estar autenticado.
- **F-03** — debe existir precio almacenado para el ticker antes de operar.


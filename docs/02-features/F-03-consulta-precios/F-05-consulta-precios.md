# F-05 — Actualización de precios (batch)

## Descripción

Proceso **independiente** que se ejecuta una única vez por invocación.
Consulta Yahoo Finance para obtener el precio de cierre más reciente de cada
ticker presente en el sistema (portfolios y watchlists), y persiste esos
precios en la base de datos.

Toda la lógica de valorización del portfolio y P&L se calcula **únicamente**
contra los precios almacenados. El proceso batch es la única parte del sistema
que habla con Yahoo Finance.

El proceso puede ejecutarse:
- Manualmente por línea de comando.
- Mediante un endpoint dedicado de la API.
- Como paso opcional en el pipeline de CI.

> Si Yahoo Finance no devuelve precio para un ticker, el proceso registra
> el error y continúa con el resto sin interrumpirse.

---

## User stories

### US-10 — Ejecutar actualización de precios
> Como operador del sistema, quiero ejecutar el proceso batch de precios,
> para que el sistema cuente con los precios de cierre más recientes.

**Criterios de aceptación:**
- El proceso consulta Yahoo Finance para todos los tickers activos en el sistema.
- Persiste el precio y el timestamp de actualización por ticker.
- Si un ticker falla, se registra el error y el proceso continúa con los demás.
- Al finalizar, el proceso reporta cuántos tickers se actualizaron y cuántos fallaron.

```gherkin

```

---

### US-11 — Ver fecha de última actualización
> Como usuario, quiero ver cuándo fue la última actualización de precios,
> para saber qué tan recientes son los datos que estoy viendo.

**Criterios de aceptación:**
- La app muestra en el portfolio y watchlist la fecha y hora del último batch exitoso.
- Si nunca se ejecutó el batch, se indica que no hay precios disponibles.

```gherkin
Feature: Fecha de última actualización de precios

  Scenario: Batch ejecutado previamente
    Given que el batch se ejecutó el "2025-05-01 18:30:00"
    When el usuario consulta su portfolio
    Then ve "Precios actualizados al: 01/05/2025 18:30"

  Scenario: Batch nunca ejecutado
    Given que el batch nunca fue ejecutado
    When el usuario consulta su portfolio
    Then ve un aviso indicando que no hay precios disponibles aún
```

---



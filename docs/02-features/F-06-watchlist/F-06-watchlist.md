# F-06 — Watchlist

## Descripción

La watchlist permite al usuario hacer **seguimiento de empresas de interés**
sin necesidad de tener una posición comprada en ellas.

Es una lista personal donde el usuario puede agregar y quitar tickers.
Los tickers en la watchlist también son incluidos en el proceso batch de
actualización de precios (F-05), por lo que el usuario puede ver el
precio actual de empresas que sigue pero no posee.

---

## User stories

### US-13 — Agregar empresa a la watchlist
> Como usuario, quiero agregar una empresa a mi watchlist,
> para seguir su precio sin necesidad de comprarla.

**Criterios de aceptación:**
- Se puede agregar por ticker.
- No se puede agregar el mismo ticker dos veces.
- El ticker queda incluido en el próximo batch de actualización de precios.

```gherkin
Feature: Agregar a watchlist

  Scenario: Agregar ticker nuevo
    Given que el usuario no tiene "TSLA" en su watchlist
    When agrega "TSLA" a su watchlist
    Then "TSLA" aparece en su watchlist
    And será incluido en el próximo batch de precios

  Scenario: Ticker ya en watchlist
    Given que el usuario ya tiene "TSLA" en su watchlist
    When intenta agregar "TSLA" nuevamente
    Then el sistema retorna un error indicando que ya está en la watchlist
```

---

### US-14 — Eliminar empresa de la watchlist
> Como usuario, quiero eliminar una empresa de mi watchlist,
> para dejar de seguirla.

**Criterios de aceptación:**
- El ticker se elimina de la watchlist del usuario.
- Si el ticker no está en la watchlist, se retorna un error descriptivo.

```gherkin
Feature: Eliminar de watchlist

  Scenario: Eliminar ticker existente
    Given que el usuario tiene "TSLA" en su watchlist
    When la elimina
    Then "TSLA" ya no aparece en su watchlist

  Scenario: Eliminar ticker inexistente
    Given que el usuario no tiene "XYZ" en su watchlist
    When intenta eliminarlo
    Then el sistema retorna un error 404
```

---

### US-15 — Ver watchlist con precios actuales
> Como usuario, quiero ver mi watchlist con el precio actual de cada empresa,
> para monitorear su evolución sin tener posición.

**Criterios de aceptación:**
- Se muestra cada ticker con su último precio almacenado en la DB.
- Se muestra la fecha y hora de la última actualización de precios.
- Si un ticker no tiene precio almacenado aún, se indica claramente.

```gherkin
Feature: Ver watchlist

  Scenario: Watchlist con precios disponibles
    Given que el usuario tiene "TSLA" y "NVDA" en su watchlist
    And ambos tienen precios almacenados en la DB
    When consulta su watchlist
    Then ve cada ticker con su último precio y la fecha de actualización

  Scenario: Ticker sin precio almacenado
    Given que el usuario tiene "XYZ" en su watchlist
    And "XYZ" no tiene precio almacenado en la DB
    When consulta su watchlist
    Then ve "XYZ" pero con indicación de precio no disponible
```

---

## Dependencias

- **F-01** — el usuario debe estar autenticado.
- **F-03** — los precios de los tickers de la watchlist son actualizados por el batch.

## Estado

- [ ] User stories refinadas
- [ ] Gherkin escrito
- [ ] En desarrollo
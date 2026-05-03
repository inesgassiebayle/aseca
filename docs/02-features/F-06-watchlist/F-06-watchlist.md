# F-06 — Watchlist

## Descripción

La watchlist permite al usuario hacer **seguimiento de empresas de interés**
sin necesidad de tener una posición comprada en ellas.

Es una lista personal donde el usuario puede agregar y quitar tickers.
Los tickers en la watchlist también son incluidos en el proceso batch de
actualización de precios (F-03), por lo que el usuario puede ver el
precio actual de empresas que sigue pero no posee.

---

## User stories

- US-14 — Agregar empresa a la watchlist
- US-15 — Eliminar empresa de la watchlist
- US-16 — Ver watchlist con precios actuales

---

## Dependencias

- **F-01** — el usuario debe estar autenticado.
- **F-03** — los precios de los tickers de la watchlist son actualizados por el batch.
# F-06 — Watchlist

## Descripción

La watchlist permite al usuario hacer **seguimiento de empresas de interés**
sin necesidad de tener una posición comprada en ellas.

Es una lista personal donde el usuario puede agregar y quitar tickers.
Los tickers en la watchlist también son incluidos en el proceso batch de
actualización de precios (F-03), por lo que el usuario puede ver el
precio actual de empresas que sigue pero no posee.

---

## Criterios de aceptación

- Un usuario puede agregar tickers a su watchlist sin necesidad de tener posición comprada.
- No se permite agregar el mismo ticker dos veces a la misma watchlist.
- Un usuario puede eliminar un ticker de su watchlist; si no existe, se retorna error descriptivo.
- La watchlist muestra el último precio almacenado para cada ticker.
- Si un ticker no tiene precio almacenado aún, se indica claramente.
- Los tickers de la watchlist se incluyen en el proceso batch de actualización de precios.
- Se muestra la fecha y hora de la última actualización de precios.

---

## User stories

- US-14 — Agregar empresa a la watchlist
- US-15 — Eliminar empresa de la watchlist
- US-16 — Ver watchlist con precios actuales

---

## Dependencias

- **F-01** — el usuario debe estar autenticado.
- **F-03** — los precios de los tickers de la watchlist son actualizados por el batch.
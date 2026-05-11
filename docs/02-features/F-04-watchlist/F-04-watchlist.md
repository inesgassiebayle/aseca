# F-04 — Watchlist

## Descripción

La watchlist permite al usuario hacer **seguimiento de empresas de interés**
sin necesidad de tener una posición comprada en ellas.

Es una lista personal donde el usuario puede agregar y quitar tickers.
Los tickers en la watchlist son incluidos en el proceso batch de actualización
de precios (F-02), por lo que el usuario puede ver el precio actual de empresas
que sigue pero no posee.

Desde la watchlist el usuario también puede **comparar métricas financieras**
entre las empresas que sigue, utilizando datos de EDGAR.

---

## Alcance de cada US

Cada user story cubre las siguientes capas:
- **Backend:** endpoint/s de la API REST implementados con tests unitarios.
- **Frontend web:** vista o componente implementado con tests de end-to-end (E2E).

---

## User stories

- US-21 — Agregar empresa a la watchlist
- US-22 — Eliminar empresa de la watchlist
- US-23 — Ver watchlist con precios actuales
- US-24 — Comparar métricas entre empresas de la watchlist
- US-25 — Ver evolución histórica comparada
- US-29 — [Mobile] Watchlist desde la app móvil 
- US-33 — [Stress] Tests de stress de watchlist

---

## Dependencias

- **F-01** — el usuario debe estar autenticado.
- **F-02** — los precios del batch y los datos de EDGAR provienen de esta feature.
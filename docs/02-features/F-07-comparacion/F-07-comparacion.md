# F-07 — Comparación de métricas financieras

## Descripción

Permite al usuario **comparar métricas financieras clave** entre dos o más
empresas de su watchlist, utilizando datos provenientes de EDGAR (F-02).

Es una vista analítica que facilita la toma de decisiones de inversión,
mostrando en paralelo las métricas fundamentales de las empresas seleccionadas.

---

## User stories

- US-17 — Comparar métricas entre empresas de la watchlist
- US-18 — Ver evolución histórica comparada

---

## Restricciones técnicas

- Los datos de EDGAR se consumen respetando el rate limit de 10 req/segundo.
- Se recomienda cachear las respuestas de EDGAR por 1 hora para evitar
  llamadas repetidas durante el uso normal de la app.

## Dependencias

- **F-01** — el usuario debe estar autenticado.
- **F-02** — los datos de métricas provienen de EDGAR.
- **F-06** — solo se pueden comparar empresas que estén en la watchlist del usuario.
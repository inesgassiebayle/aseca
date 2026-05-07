# F-07 — Comparación de métricas financieras

## Descripción

Permite al usuario **comparar métricas financieras clave** entre dos o más
empresas de su watchlist, utilizando datos provenientes de EDGAR (F-02).

Es una vista analítica que facilita la toma de decisiones de inversión,
mostrando en paralelo las métricas fundamentales de las empresas seleccionadas.

---

## Criterios de aceptación

- Se pueden seleccionar 2 o más empresas de la watchlist del usuario para comparar.
- Se muestran en paralelo las métricas: Revenue, Net Income, EPS, Total Assets y Total Liabilities.
- Si una empresa no tiene datos para una métrica, se muestra "No disponible".
- Se puede seleccionar una métrica y ver su evolución por quarters (últimos 4 a 8) para cada empresa seleccionada.
- Los datos provienen de EDGAR respetando el rate limit de 10 requests/segundo.
- Las respuestas de EDGAR se cachean por 1 hora.

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
# F-07 — Comparación de métricas financieras

## Descripción

Permite al usuario **comparar métricas financieras clave** entre dos o más
empresas de su watchlist, utilizando datos provenientes de EDGAR (F-06).

Es una vista analítica que facilita la toma de decisiones de inversión,
mostrando en paralelo las métricas fundamentales de las empresas seleccionadas.

---

## User stories

### US-16 — Comparar métricas entre empresas de la watchlist
> Como usuario, quiero comparar métricas financieras entre empresas de mi watchlist,
> para evaluar cuál representa una mejor oportunidad de inversión.

**Criterios de aceptación:**
- Se pueden seleccionar 2 o más empresas de la watchlist para comparar.
- Se muestran en paralelo las métricas disponibles para cada empresa.
- Los datos provienen de EDGAR (no de precios de mercado).
- Si una empresa no tiene datos para una métrica, se indica "No disponible".

```gherkin
Feature: Comparación de métricas financieras

  Scenario: Comparación exitosa entre dos empresas
    Given que el usuario tiene "AAPL" y "MSFT" en su watchlist
    And ambas tienen datos disponibles en EDGAR
    When solicita comparar sus métricas financieras
    Then ve una tabla con Revenue, Net Income, EPS, Total Assets
    y Total Liabilities para cada empresa en paralelo

  Scenario: Una empresa sin datos en EDGAR
    Given que el usuario tiene "AAPL" y "XYZ" en su watchlist
    And "XYZ" no tiene datos XBRL en EDGAR
    When solicita comparar sus métricas
    Then ve los datos de "AAPL" normalmente
    And para "XYZ" se indica "No disponible" en cada métrica

  Scenario: Empresa no está en watchlist
    Given que el usuario intenta comparar "TSLA" que no está en su watchlist
    When solicita la comparación
    Then el sistema retorna un error indicando que "TSLA" no está en la watchlist
```

---

### US-17 — Ver evolución histórica comparada
> Como usuario, quiero ver la evolución de una métrica específica a lo largo
> del tiempo para varias empresas, para comparar su tendencia histórica.

**Criterios de aceptación:**
- Se puede seleccionar una métrica (ej: Revenue) y ver su evolución por quarters.
- Se muestran los últimos 4 a 8 quarters para cada empresa seleccionada.
- Los datos provienen de EDGAR.

```gherkin
Feature: Evolución histórica comparada

  Scenario: Ver evolución de Revenue entre dos empresas
    Given que el usuario tiene "AAPL" y "GOOGL" en su watchlist
    When solicita comparar la evolución de Revenue de los últimos 8 quarters
    Then ve un listado por quarter con el Revenue de cada empresa
    And puede identificar la tendencia de crecimiento de cada una
```

---

## Restricciones técnicas

- Los datos de EDGAR se consumen respetando el rate limit de 10 req/segundo.
- Se recomienda cachear las respuestas de EDGAR por 1 hora para evitar
  llamadas repetidas durante el uso normal de la app.

## Dependencias

- **F-01** — el usuario debe estar autenticado.
- **F-06** — los datos de métricas provienen de EDGAR.
- **F-07** — solo se pueden comparar empresas que estén en la watchlist del usuario.

### US-06 — Ver evolución histórica de métricas de una empresa
> Como usuario, quiero ver la evolución de una métrica financiera a lo largo
> de los últimos quarters, para analizar la tendencia de la empresa.

**Criterios de aceptación:**
- Se consulta la API de EDGAR Company Facts para obtener el histórico de la métrica seleccionada.
- Se muestran los últimos 4 a 8 quarters reportados con el valor y el período correspondiente.
- Las métricas disponibles son: Revenue, Net Income, EPS.
- Se cachean los resultados por 1 hora para evitar exceder el rate limit de EDGAR.
- Si no hay suficientes quarters disponibles, se muestran los que existan sin error.
- Si la empresa no tiene datos históricos para la métrica seleccionada, se muestra un mensaje informativo.

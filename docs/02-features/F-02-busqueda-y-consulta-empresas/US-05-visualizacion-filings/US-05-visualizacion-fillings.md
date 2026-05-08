### US-14 — Ver filings recientes de una empresa
> Como usuario, quiero ver los filings más recientes de una empresa,
> para acceder a sus reportes oficiales presentados ante la SEC.

**Criterios de aceptación:**
- Se consulta la API de EDGAR Submissions para obtener los filings de la empresa.
- Se muestran solo filings de tipo 10-K y 10-Q, con tipo, fecha y enlace al documento en EDGAR.
- Se cachean los resultados por 1 hora para evitar exceder el rate limit de EDGAR.
- Si la empresa no tiene filings 10-K o 10-Q disponibles, se muestra un mensaje informativo al usuario.
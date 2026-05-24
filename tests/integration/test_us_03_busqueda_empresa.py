import time

import httpx

from tests.integration.conftest import SERVER_URL


class TestBusquedaEmpresaIntegracion:
    def test_busqueda_ticker_exacto_retorna_resultados(self):
        response = httpx.get(
            f"{SERVER_URL}/api/v1/edgar/search",
            params={"q": "AAPL"},
            timeout=30,
        )

        assert response.status_code == 200
        results = response.json()
        assert len(results) > 0
        tickers = [r["ticker"] for r in results]
        assert "AAPL" in tickers

    def test_busqueda_ticker_parcial_retorna_resultados(self):
        response = httpx.get(
            f"{SERVER_URL}/api/v1/edgar/search",
            params={"q": "MSF"},
            timeout=30,
        )

        assert response.status_code == 200
        results = response.json()
        assert len(results) > 0
        tickers = [r["ticker"] for r in results]
        assert "MSFT" in tickers

    def test_busqueda_por_nombre_retorna_resultados(self):
        response = httpx.get(
            f"{SERVER_URL}/api/v1/edgar/search",
            params={"q": "apple"},
            timeout=30,
        )

        assert response.status_code == 200
        results = response.json()
        assert len(results) > 0
        names = [r["name"].lower() for r in results]
        assert any("apple" in name for name in names)

    def test_busqueda_sin_resultados_retorna_lista_vacia(self):
        response = httpx.get(
            f"{SERVER_URL}/api/v1/edgar/search",
            params={"q": "XYZNOTEXIST99999"},
            timeout=30,
        )

        assert response.status_code == 200
        assert response.json() == []

    def test_busqueda_sin_parametro_retorna_422(self):
        response = httpx.get(
            f"{SERVER_URL}/api/v1/edgar/search",
            timeout=30,
        )

        assert response.status_code == 422

    def test_respuesta_contiene_campos_requeridos(self):
        response = httpx.get(
            f"{SERVER_URL}/api/v1/edgar/search",
            params={"q": "TSLA"},
            timeout=30,
        )

        assert response.status_code == 200
        results = response.json()
        assert len(results) > 0
        for result in results:
            assert "name" in result
            assert "ticker" in result
            assert "cik" in result
            assert isinstance(result["name"], str)
            assert isinstance(result["ticker"], str)
            assert isinstance(result["cik"], int)

    def test_cache_multiples_consultas_son_consistentes_y_rapidas(self):
        # warmup: asegura que el cache esté poblado
        httpx.get(f"{SERVER_URL}/api/v1/edgar/search", params={"q": "GOOG"}, timeout=60)

        # dos consultas distintas sobre el mismo dataset cacheado
        t0 = time.perf_counter()
        r1 = httpx.get(f"{SERVER_URL}/api/v1/edgar/search", params={"q": "GOOG"}, timeout=10)
        r2 = httpx.get(f"{SERVER_URL}/api/v1/edgar/search", params={"q": "GOOG"}, timeout=10)
        elapsed = time.perf_counter() - t0

        assert r1.status_code == 200
        assert r2.status_code == 200
        # resultados idénticos: el cache devuelve el mismo dataset
        assert r1.json() == r2.json()
        # ambas llamadas cacheadas deben completarse en menos de 2s combinadas
        assert elapsed < 2.0

    def test_busqueda_case_insensitive_nombre(self):
        r_lower = httpx.get(
            f"{SERVER_URL}/api/v1/edgar/search",
            params={"q": "microsoft"},
            timeout=30,
        )
        r_upper = httpx.get(
            f"{SERVER_URL}/api/v1/edgar/search",
            params={"q": "MICROSOFT"},
            timeout=30,
        )

        assert r_lower.status_code == 200
        assert r_upper.status_code == 200
        names_lower = {r["name"] for r in r_lower.json()}
        names_upper = {r["name"] for r in r_upper.json()}
        assert names_lower == names_upper
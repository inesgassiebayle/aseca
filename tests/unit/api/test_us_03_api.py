class TestBusquedaEmpresaAPI:
    def test_busqueda_retorna_200_con_resultados(self, edgar_client):
        c, mock_service = edgar_client
        mock_service.search_companies.return_value = [
            {"name": "Apple Inc.", "ticker": "AAPL", "cik": 320193}
        ]

        response = c.get("/api/v1/edgar/search?q=apple")

        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["name"] == "Apple Inc."
        assert body[0]["ticker"] == "AAPL"
        assert body[0]["cik"] == 320193

    def test_busqueda_sin_resultados_retorna_200_y_lista_vacia(self, edgar_client):
        c, mock_service = edgar_client
        mock_service.search_companies.return_value = []

        response = c.get("/api/v1/edgar/search?q=xyznotfound")

        assert response.status_code == 200
        assert response.json() == []

    def test_busqueda_sin_parametro_retorna_422(self, edgar_client):
        c, _ = edgar_client

        response = c.get("/api/v1/edgar/search")

        assert response.status_code == 422

    def test_busqueda_llama_al_service_con_query(self, edgar_client):
        c, mock_service = edgar_client
        mock_service.search_companies.return_value = []

        c.get("/api/v1/edgar/search?q=microsoft")

        mock_service.search_companies.assert_called_once_with("microsoft")

    def test_busqueda_multiples_resultados(self, edgar_client):
        c, mock_service = edgar_client
        mock_service.search_companies.return_value = [
            {"name": "Amazon.com Inc.", "ticker": "AMZN", "cik": 1018724},
            {"name": "Amazon Prime Corp", "ticker": "AMZP", "cik": 2},
        ]

        response = c.get("/api/v1/edgar/search?q=amazon")

        assert response.status_code == 200
        assert len(response.json()) == 2
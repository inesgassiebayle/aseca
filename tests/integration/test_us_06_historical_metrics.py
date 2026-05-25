import pytest
import httpx

from app.services.edgar_service import EdgarService, TtlKeyedCache

GOOGL_CIK = 1652044
MSFT_CIK  = 789019

@pytest.fixture(scope="module")
def edgar_service():
    client = httpx.Client(timeout=30.0)
    yield EdgarService(http_client=client)
    client.close()

@pytest.fixture(autouse=True)
def reset_metrics_cache(edgar_service):
    """Resetea el cache antes de cada test para forzar llamada real a EDGAR."""
    edgar_service.metrics_cache = TtlKeyedCache()


class TestUS06ConsultaDesdeApi:
    def test_retorna_data_points_desde_api(self, edgar_service):
        result = edgar_service.get_metric_history(cik=GOOGL_CIK, metric="revenue")

        assert result["cached"] is False
        assert result["cik"] == GOOGL_CIK
        assert result["metric"] == "revenue"
        assert 1 <= len(result["data_points"]) <= 8

    def test_cada_data_point_tiene_periodo_con_formato_correcto(self, edgar_service):
        result = edgar_service.get_metric_history(cik=GOOGL_CIK, metric="revenue")
        for dp in result["data_points"]:
            parts = dp["period_end"].split("-")
            assert len(parts) == 3  # YYYY-MM-DD

    def test_values_son_numericos_y_positivos(self, edgar_service):
        result = edgar_service.get_metric_history(cik=GOOGL_CIK, metric="revenue")
        for dp in result["data_points"]:
            assert isinstance(dp["value"], (int, float))
            assert dp["value"] > 0

    def test_forms_son_validos(self, edgar_service):
        result = edgar_service.get_metric_history(cik=GOOGL_CIK, metric="revenue")
        for dp in result["data_points"]:
            assert dp["form"] in {"10-K", "10-Q"}

    def test_ordenados_del_mas_reciente_al_mas_viejo(self, edgar_service):
        result = edgar_service.get_metric_history(cik=GOOGL_CIK, metric="revenue")
        dates = [dp["period_end"] for dp in result["data_points"]]
        assert dates == sorted(dates, reverse=True)


class TestUS06ConsultaDesdeCache:
    def test_segunda_llamada_viene_del_cache(self, edgar_service):
        first = edgar_service.get_metric_history(cik=GOOGL_CIK, metric="revenue")
        assert first["cached"] is False

        # NO reseteamos el cache — simula segunda llamada dentro del TTL
        second = edgar_service.get_metric_history(cik=GOOGL_CIK, metric="revenue")
        assert second["cached"] is True

    def test_datos_del_cache_son_identicos(self, edgar_service):
        first = edgar_service.get_metric_history(cik=GOOGL_CIK, metric="revenue")
        second = edgar_service.get_metric_history(cik=GOOGL_CIK, metric="revenue")
        assert first["data_points"] == second["data_points"]


class TestUS06PocosQuarters:
    def test_quarters_param_limita_resultados(self, edgar_service):
        result = edgar_service.get_metric_history(cik=MSFT_CIK, metric="revenue", quarters=4)
        assert len(result["data_points"]) <= 4



class TestUS06MetricasSoportadas:
    @pytest.mark.parametrize("metric", ["revenue", "net_income", "eps"])
    def test_metrica_retorna_datos_sin_error(self, edgar_service, metric):
        result = edgar_service.get_metric_history(cik=GOOGL_CIK, metric=metric)
        assert "data_points" in result
        assert isinstance(result["data_points"], list)

    def test_metrica_no_soportada_lanza_value_error(self, edgar_service):
        with pytest.raises(ValueError, match="Métrica no soportada"):
            edgar_service.get_metric_history(cik=GOOGL_CIK, metric="invalid_metric")
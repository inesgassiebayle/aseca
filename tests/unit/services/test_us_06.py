from datetime import timedelta
from unittest.mock import MagicMock

import pytest

from app.services.edgar_service import EdgarService, TtlKeyedCache

MOCK_FACTS_GOOGL = {
    "cik": 1652044,
    "entityName": "Alphabet Inc.",
    "facts": {
        "us-gaap": {
            "Revenues": {
                "units": {
                    "USD": [
                        {"end": "2024-09-30", "val": 88268000000, "form": "10-Q", "filed": "2024-10-29"},
                        {"end": "2024-06-30", "val": 84742000000, "form": "10-Q", "filed": "2024-07-30"},
                        {"end": "2024-03-31", "val": 80539000000, "form": "10-Q", "filed": "2024-04-29"},
                        {"end": "2023-12-31", "val": 307394000000, "form": "10-K", "filed": "2024-01-31"},
                        {"end": "2023-09-30", "val": 76693000000, "form": "10-Q", "filed": "2023-10-24"},
                        {"end": "2023-06-30", "val": 74799000000, "form": "10-Q", "filed": "2023-07-25"},
                        {"end": "2023-03-31", "val": 69787000000, "form": "10-Q", "filed": "2023-04-25"},
                        {"end": "2022-12-31", "val": 282836000000, "form": "10-K", "filed": "2023-02-02"},
                        {"end": "2022-09-30", "val": 69092000000, "form": "10-Q/A", "filed": "2022-11-10"},
                    ]
                }
            }
        }
    },
}

MOCK_FACTS_NET_INCOME = {
    "cik": 1652044, "entityName": "Alphabet Inc.",
    "facts": {
        "us-gaap": {
            "NetIncomeLoss": {
                "units": {
                    "USD": [
                        {"end": "2024-09-30", "val": 19689000000, "form": "10-Q", "filed": "2024-10-29"},
                        {"end": "2024-06-30", "val": 23619000000, "form": "10-Q", "filed": "2024-07-30"},
                    ]
                }
            }
        }
    },
}

MOCK_FACTS_EPS = {
    "cik": 1652044, "entityName": "Alphabet Inc.",
    "facts": {
        "us-gaap": {
            "EarningsPerShareBasic": {
                "units": {
                    "USD/shares": [
                        {"end": "2024-09-30", "val": 2.12, "form": "10-Q", "filed": "2024-10-29"},
                        {"end": "2024-06-30", "val": 1.89, "form": "10-Q", "filed": "2024-07-30"},
                    ]
                }
            }
        }
    },
}

MOCK_FACTS_FEW_QUARTERS = {
    "cik": 1234567, "entityName": "Small Corp",
    "facts": {
        "us-gaap": {
            "Revenues": {
                "units": {
                    "USD": [
                        {"end": "2024-09-30", "val": 1000000, "form": "10-Q", "filed": "2024-10-15"},
                        {"end": "2024-06-30", "val": 900000,  "form": "10-Q", "filed": "2024-07-15"},
                        {"end": "2024-03-31", "val": 800000,  "form": "10-Q", "filed": "2024-04-15"},
                    ]
                }
            }
        }
    },
}

MOCK_FACTS_NO_METRIC = {
    "cik": 9999999, "entityName": "No Revenue Corp",
    "facts": {"us-gaap": {}},
}

MOCK_FACTS_ALT_CONCEPT = {
    "cik": 1111111, "entityName": "Alt Corp",
    "facts": {
        "us-gaap": {
            "RevenueFromContractWithCustomerExcludingAssessedTax": {
                "units": {
                    "USD": [
                        {"end": "2024-09-30", "val": 5000000, "form": "10-Q", "filed": "2024-10-10"},
                    ]
                }
            }
        }
    },
}


@pytest.fixture
def http_client():
    return MagicMock()

@pytest.fixture
def service(http_client):
    return EdgarService(http_client=http_client)

def _setup_response(http_client, payload: dict) -> None:
    mock_resp = MagicMock()
    mock_resp.json.return_value = payload
    http_client.get.return_value = mock_resp


class TestGetMetricHistoryFromApi:
    def test_retorna_hasta_8_quarters(self, service, http_client):
        _setup_response(http_client, MOCK_FACTS_GOOGL)
        result = service.get_metric_history(cik=1652044, metric="revenue")
        assert 1 <= len(result["data_points"]) <= 8

    def test_cached_es_false(self, service, http_client):
        _setup_response(http_client, MOCK_FACTS_GOOGL)
        result = service.get_metric_history(cik=1652044, metric="revenue")
        assert result["cached"] is False

    def test_retorna_cik_y_metrica_correctos(self, service, http_client):
        _setup_response(http_client, MOCK_FACTS_GOOGL)
        result = service.get_metric_history(cik=1652044, metric="revenue")
        assert result["cik"] == 1652044
        assert result["metric"] == "revenue"

    def test_data_points_tienen_campos_requeridos(self, service, http_client):
        _setup_response(http_client, MOCK_FACTS_GOOGL)
        result = service.get_metric_history(cik=1652044, metric="revenue")
        for dp in result["data_points"]:
            assert "period_end" in dp
            assert "value" in dp
            assert "form" in dp
            assert "filed" in dp

    def test_data_points_ordenados_desc(self, service, http_client):
        _setup_response(http_client, MOCK_FACTS_GOOGL)
        result = service.get_metric_history(cik=1652044, metric="revenue")
        dates = [dp["period_end"] for dp in result["data_points"]]
        assert dates == sorted(dates, reverse=True)

    def test_solo_incluye_10k_y_10q(self, service, http_client):
        _setup_response(http_client, MOCK_FACTS_GOOGL)
        result = service.get_metric_history(cik=1652044, metric="revenue")
        for dp in result["data_points"]:
            assert dp["form"] in {"10-K", "10-Q"}

    def test_value_es_float(self, service, http_client):
        _setup_response(http_client, MOCK_FACTS_GOOGL)
        result = service.get_metric_history(cik=1652044, metric="revenue")
        for dp in result["data_points"]:
            assert isinstance(dp["value"], float)

    def test_metrica_net_income(self, service, http_client):
        _setup_response(http_client, MOCK_FACTS_NET_INCOME)
        result = service.get_metric_history(cik=1652044, metric="net_income")
        assert result["metric"] == "net_income"
        assert len(result["data_points"]) == 2

    def test_metrica_eps(self, service, http_client):
        _setup_response(http_client, MOCK_FACTS_EPS)
        result = service.get_metric_history(cik=1652044, metric="eps")
        assert result["metric"] == "eps"
        assert len(result["data_points"]) == 2

    def test_usa_concepto_alternativo_si_primero_no_existe(self, service, http_client):
        _setup_response(http_client, MOCK_FACTS_ALT_CONCEPT)
        result = service.get_metric_history(cik=1111111, metric="revenue")
        assert len(result["data_points"]) == 1
        assert result["data_points"][0]["value"] == 5000000.0


class TestGetMetricHistoryFromCache:
    def test_segunda_consulta_viene_del_cache(self, service, http_client):
        _setup_response(http_client, MOCK_FACTS_GOOGL)
        service.get_metric_history(cik=1652044, metric="revenue")
        http_client.get.reset_mock()

        result = service.get_metric_history(cik=1652044, metric="revenue")

        assert result["cached"] is True
        http_client.get.assert_not_called()

    def test_cache_expirado_vuelve_a_llamar_edgar(self, service, http_client):
        _setup_response(http_client, MOCK_FACTS_GOOGL)
        service.metrics_cache = TtlKeyedCache(ttl=timedelta(seconds=-1))

        result = service.get_metric_history(cik=1652044, metric="revenue")

        assert result["cached"] is False
        http_client.get.assert_called_once()

    def test_cache_es_independiente_por_metrica(self, service, http_client):
        _setup_response(http_client, MOCK_FACTS_GOOGL)
        service.get_metric_history(cik=1652044, metric="revenue")
        http_client.reset_mock()

        _setup_response(http_client, MOCK_FACTS_NET_INCOME)
        result = service.get_metric_history(cik=1652044, metric="net_income")

        assert result["cached"] is False
        http_client.get.assert_called_once()


class TestGetMetricHistoryEdgeCases:
    def test_menos_de_8_quarters_retorna_los_disponibles(self, service, http_client):
        _setup_response(http_client, MOCK_FACTS_FEW_QUARTERS)
        result = service.get_metric_history(cik=1234567, metric="revenue")
        assert len(result["data_points"]) == 3

    def test_sin_datos_retorna_lista_vacia(self, service, http_client):
        _setup_response(http_client, MOCK_FACTS_NO_METRIC)
        result = service.get_metric_history(cik=9999999, metric="revenue")
        assert result["data_points"] == []

    def test_metrica_invalida_lanza_value_error(self, service, http_client):
        with pytest.raises(ValueError, match="Métrica no soportada"):
            service.get_metric_history(cik=1652044, metric="invalid_metric")

    def test_quarters_param_limita_resultados(self, service, http_client):
        _setup_response(http_client, MOCK_FACTS_GOOGL)
        result = service.get_metric_history(cik=1652044, metric="revenue", quarters=4)
        assert len(result["data_points"]) <= 4

    def test_no_duplica_mismo_periodo(self, service, http_client):
        facts = {
            "cik": 1652044, "entityName": "Test",
            "facts": {
                "us-gaap": {
                    "Revenues": {
                        "units": {
                            "USD": [
                                {"end": "2024-09-30", "val": 88000000000, "form": "10-Q", "filed": "2024-10-29"},
                                {"end": "2024-09-30", "val": 88200000000, "form": "10-Q", "filed": "2024-11-01"},
                            ]
                        }
                    }
                }
            },
        }
        _setup_response(http_client, facts)
        result = service.get_metric_history(cik=1652044, metric="revenue")
        periods = [dp["period_end"] for dp in result["data_points"]]
        assert len(periods) == len(set(periods))
        assert result["data_points"][0]["value"] == 88200000000.0
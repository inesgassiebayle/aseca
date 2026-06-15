"""
locustfile.py — Zest Performance Test Suite
============================================
Dos esquemas de prueba controlados por la variable de entorno TEST_MODE:

  TEST_MODE=load    → Load Test  : 50 VU sostenidos, ramp-up 5 VU/s,
                                   8 min de plateau (~10 min total).
                                   Valida SLOs en carga nominal.

  TEST_MODE=stress  → Stress Test: escalones 30→60→100→150 VU + recovery a 30 VU.
                                   18 min total. Encuentra el breaking point
                                   y verifica recuperación.

Uso rápido:
  TEST_MODE=load   locust --headless -u 50 -r 5 --run-time 10m -f locustfile.py --host http://localhost:8000
  TEST_MODE=stress locust --headless -f locustfile.py --host http://localhost:8000

Docker con recursos limitados (ver docker-compose.constrained.yml en la raíz):
  docker compose -f docker-compose.yml -f docker-compose.constrained.yml up -d
  TEST_MODE=stress locust --headless -f locustfile.py --host http://localhost:8000

Constraint EDGAR: rate limit externo de 10 req/s.
  → Todos los perfiles EDGAR mantienen ratio cached:real ≥ 2:1 para
    mantenerse bajo el límite en load test (~4–7 req/s totales a EDGAR).
  → En stress test superar el límite a partir de 100 VU es intencional:
    se observa si la app maneja los 429 gracefully o los propaga.

Batch de precios: el job corre una única vez al día.
  → PricesUser tiene peso bajo (2) y sus endpoints son puramente de caché.
  → No genera tráfico externo en runtime — solo valida latencia del caché interno.

SLOs de referencia (load test):
  p95 < 500ms para endpoints REST internos
  p95 < 2s    para endpoints que tocan EDGAR upstream
  error rate  < 0.1% (excluyendo errores de negocio esperados: 409, 422, 404)
"""

import os
import random
import uuid

from locust import HttpUser, LoadTestShape, task, between, constant, TaskSet, events

# ── Modo de test ──────────────────────────────────────────────────────────────

TEST_MODE = os.getenv("TEST_MODE", "load").lower()

if TEST_MODE not in ("load", "stress"):
    raise ValueError(f"TEST_MODE debe ser 'load' o 'stress', recibido: '{TEST_MODE}'")

# ── Constantes de la aplicación ───────────────────────────────────────────────

BASE_URL        = "/api/v1/auth"
BASE_PORTFOLIO  = "/api/v1/portfolio"
BASE_OPERATIONS = "/api/v1/operations"
EDGAR_URL       = "/api/v1/edgar"
PRICES_URL      = "/api/v1/prices"
BASE_WATCHLIST  = "/api/v1/watchlist"

SHARED_USER_EMAIL    = "stress_user@test.com"
SHARED_USER_PASSWORD = "StressPass123"

STRESS_TICKER = "AAPL"

COMPANIES = [
    {"ticker": "AAPL",  "cik": 320193},
    {"ticker": "MSFT",  "cik": 789019},
    {"ticker": "GOOGL", "cik": 1652044},
    {"ticker": "AMZN",  "cik": 1018724},
    {"ticker": "TSLA",  "cik": 1318605},
]

SEARCH_QUERIES   = ["Apple", "Microsoft", "Amazon", "Tesla", "AAPL", "MSFT", "corp", "tech"]
SUPPORTED_METRICS = ["revenue", "net_income", "eps"]

WHITELIST_SAMPLE = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA",
    "UNH", "JNJ", "XOM", "JPM", "V", "PG", "MA", "HD", "CVX", "MRK",
    "ABBV", "PEP", "KO",
]

# ── Wait times diferenciados por modo ─────────────────────────────────────────
# Load  → think time realista, simula usuario humano pausado
# Stress → think time reducido para maximizar throughput por VU y presionar el sistema

def _wait(load_min, load_max, stress_min, stress_max):
    """Devuelve la función wait_time correcta según TEST_MODE."""
    if TEST_MODE == "stress":
        return between(stress_min, stress_max)
    return between(load_min, load_max)


# ── TaskSets (comportamiento de usuarios — sin cambios funcionales) ────────────

class RegisterBehavior(TaskSet):
    @task
    def register_new_user(self):
        email = f"user_{uuid.uuid4().hex[:12]}@test.com"
        self.client.post(
            f"{BASE_URL}/register",
            json={"email": email, "password": "StressPass123"},
            name="/api/v1/auth/register",
        )


class LoginBehavior(TaskSet):
    def on_start(self):
        # Registra el usuario compartido una sola vez; ignora 409 si ya existe
        with self.client.post(
                f"{BASE_URL}/register",
                json={"email": SHARED_USER_EMAIL, "password": SHARED_USER_PASSWORD},
                name="/api/v1/auth/register [setup]",
                catch_response=True,
        ) as resp:
            if resp.status_code in (201, 409):
                resp.success()

    @task
    def login(self):
        self.client.post(
            f"{BASE_URL}/login",
            json={"email": SHARED_USER_EMAIL, "password": SHARED_USER_PASSWORD},
            name="/api/v1/auth/login",
        )


class SearchBehavior(TaskSet):
    # Ratio cached:real = 2:1 → mitiga rate limit EDGAR (~33% alcanza upstream)
    @task
    def search_by_name(self):
        q = random.choice(SEARCH_QUERIES)
        self.client.get(
            f"{EDGAR_URL}/search",
            params={"q": q},
            name="/api/v1/edgar/search",
        )

    @task(2)
    def search_same_query_cached(self):
        # "Apple" es la query con mayor probabilidad de estar en caché
        self.client.get(
            f"{EDGAR_URL}/search",
            params={"q": "Apple"},
            name="/api/v1/edgar/search [cached]",
        )


class FinancialsBehavior(TaskSet):
    # Ratio cached:real = 3:1 → solo 25% alcanza EDGAR upstream
    @task
    def get_financials(self):
        company = random.choice(COMPANIES)
        self.client.get(
            f"{EDGAR_URL}/company/{company['cik']}/financials",
            params={"ticker": company["ticker"]},
            name="/api/v1/edgar/company/{cik}/financials",
        )

    @task(3)
    def get_financials_cached(self):
        self.client.get(
            f"{EDGAR_URL}/company/320193/financials",
            params={"ticker": "AAPL"},
            name="/api/v1/edgar/company/{cik}/financials [cached]",
        )


class FilingsBehavior(TaskSet):
    # Ratio cached:real = 2:1
    @task
    def get_filings(self):
        company = random.choice(COMPANIES)
        self.client.get(
            f"{EDGAR_URL}/companies/{company['cik']}/filings",
            name="/api/v1/edgar/companies/{cik}/filings",
        )

    @task(2)
    def get_filings_cached(self):
        self.client.get(
            f"{EDGAR_URL}/companies/320193/filings",
            name="/api/v1/edgar/companies/{cik}/filings [cached]",
        )


class MetricsBehavior(TaskSet):
    # Ratio cached:real = 2:1
    @task
    def get_metric_history(self):
        company = random.choice(COMPANIES)
        metric = random.choice(SUPPORTED_METRICS)
        self.client.get(
            f"{EDGAR_URL}/companies/{company['cik']}/metrics/{metric}",
            params={"quarters": 8},
            name="/api/v1/edgar/companies/{cik}/metrics/{metric}",
        )

    @task(2)
    def get_metric_history_cached(self):
        self.client.get(
            f"{EDGAR_URL}/companies/320193/metrics/revenue",
            params={"quarters": 8},
            name="/api/v1/edgar/companies/{cik}/metrics/{metric} [cached]",
        )


class PricesBehavior(TaskSet):
    # Endpoints puramente de caché (batch diario) — no genera tráfico externo
    @task
    def get_ticker_price(self):
        ticker = random.choice([c["ticker"] for c in COMPANIES])
        self.client.get(
            f"{PRICES_URL}/{ticker}",
            name="/api/v1/prices/{ticker}",
        )

    @task
    def get_last_update(self):
        # También funciona como health check implícito del job batch
        self.client.get(
            f"{PRICES_URL}/last-update",
            name="/api/v1/prices/last-update",
        )


class PortfolioBehavior(TaskSet):
    token: str = None

    def on_start(self):
        # Cada VU crea su propio usuario para aislar estado de portfolio
        email    = f"stress_{uuid.uuid4().hex[:8]}@test.com"
        password = "StressPass123"

        with self.client.post(
                f"{BASE_URL}/register",
                json={"email": email, "password": password},
                name="/api/v1/auth/register [setup]",
                catch_response=True,
        ) as resp:
            if resp.status_code in (201, 409):
                resp.success()

        resp = self.client.post(
            f"{BASE_URL}/login",
            json={"email": email, "password": password},
            name="/api/v1/auth/login [setup]",
        )
        if resp.status_code == 200:
            self.token = resp.json().get("access_token")

    def auth_headers(self):
        return {"Authorization": f"Bearer {self.token}"}

    # READ(3) > WRITE_BUY(2) = HISTORY(2) > WRITE_SELL(1) = DETAIL(1)
    # Replica patrón real: consulta más de lo que opera, compra más de lo que vende

    @task(3)
    def get_portfolio(self):
        self.client.get(
            f"{BASE_PORTFOLIO}/",
            headers=self.auth_headers(),
            name="/api/v1/portfolio/ [GET]",
        )

    @task(2)
    def buy_shares(self):
        # 422 = fondos insuficientes → error de negocio esperado, no de infraestructura
        with self.client.post(
                f"{BASE_PORTFOLIO}/buy",
                json={"ticker": STRESS_TICKER, "quantity": 1},
                headers=self.auth_headers(),
                name="/api/v1/portfolio/buy [POST]",
                catch_response=True,
        ) as resp:
            if resp.status_code in (201, 422):
                resp.success()

    @task(1)
    def sell_shares(self):
        with self.client.post(
                f"{BASE_PORTFOLIO}/sell",
                json={"ticker": STRESS_TICKER, "quantity": 1},
                headers=self.auth_headers(),
                name="/api/v1/portfolio/sell [POST]",
                catch_response=True,
        ) as resp:
            if resp.status_code in (201, 422):
                resp.success()

    @task(2)
    def get_operations(self):
        self.client.get(
            f"{BASE_OPERATIONS}/",
            headers=self.auth_headers(),
            name="/api/v1/operations/ [GET]",
        )

    @task(1)
    def get_position_detail(self):
        with self.client.get(
                f"{BASE_PORTFOLIO}/{STRESS_TICKER}",
                headers=self.auth_headers(),
                name="/api/v1/portfolio/{ticker} [GET]",
                catch_response=True,
        ) as resp:
            if resp.status_code in (200, 404):
                resp.success()


class WatchlistBehavior(TaskSet):
    """US-21, US-22, US-23 — agregar, eliminar y ver watchlist."""
    token: str = None

    def on_start(self):
        email    = f"stress_{uuid.uuid4().hex[:8]}@test.com"
        password = "StressPass123"

        with self.client.post(
                f"{BASE_URL}/register",
                json={"email": email, "password": password},
                name="/api/v1/auth/register [setup]",
                catch_response=True,
        ) as resp:
            if resp.status_code in (201, 409):
                resp.success()

        resp = self.client.post(
            f"{BASE_URL}/login",
            json={"email": email, "password": password},
            name="/api/v1/auth/login [setup]",
        )
        if resp.status_code == 200:
            self.token = resp.json().get("access_token")
        self.added_tickers: list[str] = []

    def auth_headers(self):
        return {"Authorization": f"Bearer {self.token}"}

    # ADD(4) > GET(3) > REMOVE(2) > WHITELIST(1)
    # Modela onboarding: usuario armando su watchlist por primera vez

    @task(3)
    def get_watchlist(self):
        """US-23 — ver watchlist con precios."""
        self.client.get(
            f"{BASE_WATCHLIST}/",
            headers=self.auth_headers(),
            name="/api/v1/watchlist/ [GET]",
        )

    @task(4)
    def add_ticker(self):
        """US-21 — agregar empresa a la watchlist."""
        ticker = random.choice(WHITELIST_SAMPLE)
        with self.client.post(
                f"{BASE_WATCHLIST}/",
                json={"ticker": ticker},
                headers=self.auth_headers(),
                name="/api/v1/watchlist/ [POST]",
                catch_response=True,
        ) as resp:
            if resp.status_code in (201, 409):
                resp.success()
                if resp.status_code == 201:
                    self.added_tickers.append(ticker)

    @task(2)
    def remove_ticker(self):
        """US-22 — eliminar empresa de la watchlist."""
        if not self.added_tickers:
            # Guard: evita 404s espurios que contaminarían el error rate
            return
        ticker = self.added_tickers.pop()
        with self.client.delete(
                f"{BASE_WATCHLIST}/{ticker}",
                headers=self.auth_headers(),
                name="/api/v1/watchlist/{ticker} [DELETE]",
                catch_response=True,
        ) as resp:
            if resp.status_code in (200, 404):
                resp.success()

    @task(1)
    def get_whitelist(self):
        """Whitelist pública — sin auth requerida."""
        self.client.get(
            f"{BASE_WATCHLIST}/whitelist",
            name="/api/v1/watchlist/whitelist",
        )


class WatchlistCompareBehavior(TaskSet):
    """US-24, US-25 — comparar métricas e historial de precio."""
    token: str = None

    def on_start(self):
        email    = f"stress_{uuid.uuid4().hex[:8]}@test.com"
        password = "StressPass123"

        with self.client.post(
                f"{BASE_URL}/register",
                json={"email": email, "password": password},
                name="/api/v1/auth/register [setup]",
                catch_response=True,
        ) as resp:
            if resp.status_code in (201, 409):
                resp.success()

        resp = self.client.post(
            f"{BASE_URL}/login",
            json={"email": email, "password": password},
            name="/api/v1/auth/login [setup]",
        )
        if resp.status_code == 200:
            self.token = resp.json().get("access_token")

        # Setup: pre-carga 3 tickers en watchlist antes de empezar a comparar
        # Garantiza que las comparaciones no fallen por estado vacío
        self.compare_tickers = random.sample(WHITELIST_SAMPLE, 3)
        for t in self.compare_tickers:
            with self.client.post(
                    f"{BASE_WATCHLIST}/",
                    json={"ticker": t},
                    headers=self.auth_headers(),
                    name="/api/v1/watchlist/ [POST setup]",
                    catch_response=True,
            ) as resp:
                if resp.status_code in (201, 409):
                    resp.success()

    def auth_headers(self):
        return {"Authorization": f"Bearer {self.token}"}

    # COMPARE_METRICS(3) > COMPARE_HISTORY(2) > GET_WATCHLIST(1)
    # Power user que usa activamente la feature de comparación

    @task(3)
    def compare_metrics(self):
        """US-24 — comparar métricas entre empresas."""
        tickers = ",".join(self.compare_tickers)
        with self.client.get(
                f"{BASE_WATCHLIST}/compare?tickers={tickers}",
                headers=self.auth_headers(),
                name="/api/v1/watchlist/compare [GET]",
                catch_response=True,
        ) as resp:
            if resp.status_code in (200, 404):
                resp.success()

    @task(2)
    def compare_history(self):
        """US-25 — ver evolución histórica."""
        tickers = ",".join(self.compare_tickers)
        metric = random.choice(SUPPORTED_METRICS)
        with self.client.get(
                f"{BASE_WATCHLIST}/compare/history?tickers={tickers}&metric={metric}&quarters=8",
                headers=self.auth_headers(),
                name="/api/v1/watchlist/compare/history [GET]",
                catch_response=True,
        ) as resp:
            if resp.status_code in (200, 404):
                resp.success()

    @task(1)
    def get_watchlist(self):
        self.client.get(
            f"{BASE_WATCHLIST}/",
            headers=self.auth_headers(),
            name="/api/v1/watchlist/ [GET]",
        )


# ── HttpUser classes ───────────────────────────────────────────────────────────
# wait_time se ajusta automáticamente según TEST_MODE:
#   Load   → think time realista (simula usuario humano)
#   Stress → think time reducido (maximiza presión sobre el sistema)

class RegisterUser(HttpUser):
    tasks     = [RegisterBehavior]
    wait_time = _wait(1, 3, 0.5, 1)
    weight    = 1


class LoginUser(HttpUser):
    tasks     = [LoginBehavior]
    wait_time = _wait(1, 2, 0.5, 1)
    weight    = 3


class SearchUser(HttpUser):
    tasks     = [SearchBehavior]
    wait_time = _wait(2, 4, 1, 2)   # mínimo 1s en stress → respeta parcialmente EDGAR
    weight    = 3


class FinancialsUser(HttpUser):
    tasks     = [FinancialsBehavior]
    wait_time = _wait(2, 5, 1, 2)
    weight    = 4


class FilingsUser(HttpUser):
    tasks     = [FilingsBehavior]
    wait_time = _wait(2, 4, 1, 2)
    weight    = 3


class MetricsUser(HttpUser):
    tasks     = [MetricsBehavior]
    wait_time = _wait(2, 5, 1, 2)
    weight    = 3


class PricesUser(HttpUser):
    tasks     = [PricesBehavior]
    wait_time = _wait(1, 2, 0.5, 1)
    weight    = 2


class PortfolioUser(HttpUser):
    tasks     = [PortfolioBehavior]
    wait_time = _wait(1, 2, 0.5, 1)
    weight    = 5


class WatchlistUser(HttpUser):
    tasks     = [WatchlistBehavior]
    wait_time = _wait(1, 3, 0.5, 1)
    weight    = 5


class WatchlistCompareUser(HttpUser):
    tasks     = [WatchlistCompareBehavior]
    wait_time = _wait(2, 5, 1, 2)
    weight    = 3


# ── LoadTestShape — solo activa en TEST_MODE=stress ───────────────────────────
#
# En TEST_MODE=load NO se define ningún Shape: los parámetros -u y -r
# se pasan directamente por CLI y Locust los gestiona internamente.
#   Comando: locust --headless -u 50 -r 5 --run-time 10m -f locustfile.py --host <URL>
#
# En TEST_MODE=stress el Shape controla la ejecución completa (18 min total).

if TEST_MODE == "stress":

    class StressTestShape(LoadTestShape):
        """
        Estrategia escalonada: 18 min total.

          Fase        | Tiempo     | VU  | Spawn  | Objetivo
          ----------- | ---------- | --- | ------ | ----------------------------
          Baseline    |  0–3 min   |  30 |  5/s   | Referencia estable
          Escalón 1   |  3–7 min   |  60 | 10/s   | Carga moderada
          Escalón 2   |  7–12 min  | 100 | 15/s   | EDGAR entra en zona límite
          Escalón 3   | 12–16 min  | 150 | 20/s   | Breaking point
          Recovery    | 16–18 min  |  30 | 50/s   | ¿El sistema se recupera?

        Con docker-compose.constrained.yml (API 0.5 CPU / 512 MB, DB 0.5 CPU / 256 MB)
        el breaking point suele aparecer ya en Escalón 2.
        """

        stages = [
            # (duration_s, users, spawn_rate)
            {"duration":  3 * 60, "users":  30, "spawn_rate":  5},   # Baseline   (0–3 min)
            {"duration":  7 * 60, "users":  60, "spawn_rate": 10},   # Escalón 1  (3–7 min)
            {"duration": 12 * 60, "users": 100, "spawn_rate": 15},   # Escalón 2  (7–12 min)
            {"duration": 16 * 60, "users": 150, "spawn_rate": 20},   # Escalón 3  (12–16 min)
            {"duration": 18 * 60, "users":  30, "spawn_rate": 50},   # Recovery   (16–18 min)
        ]

        def tick(self):
            run_time = self.get_run_time()

            for stage in self.stages:
                if run_time < stage["duration"]:
                    return stage["users"], stage["spawn_rate"]

            # Fin del test — None detiene Locust automáticamente
            return None


# ── Logging de modo activo al iniciar ─────────────────────────────────────────

@events.init.add_listener
def on_locust_init(environment, **kwargs):
    mode_label = "LOAD TEST  (50 VU, ramp 5 VU/s, 10 min total)" \
        if TEST_MODE == "load" \
        else "STRESS TEST (30→60→100→150 VU, 18 min total)"
    print(f"\n{'='*60}")
    print(f"  TEST_MODE activo: {TEST_MODE.upper()}")
    print(f"  Esquema        : {mode_label}")
    if TEST_MODE == "load":
        print(f"  Comando:")
        print(f"    locust --headless -u 50 -r 5 --run-time 10m -f locustfile.py --host <URL>")
    else:
        print(f"  El Shape controla la ejecución automáticamente (18 min total).")
        print(f"  Comando:")
        print(f"    locust --headless -f locustfile.py --host <URL>")
        print(f"  Con recursos limitados:")
        print(f"    docker compose -f docker-compose.yml -f docker-compose.constrained.yml up -d")
    print(f"{'='*60}\n")
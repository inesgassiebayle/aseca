import random
import uuid
from locust import HttpUser, task, between, TaskSet


BASE_URL = "/api/v1/auth"
BASE_PORTFOLIO = "/api/v1/portfolio"
BASE_OPERATIONS = "/api/v1/operations"
EDGAR_URL = "/api/v1/edgar"
PRICES_URL = "/api/v1/prices"
BASE_WATCHLIST = "/api/v1/watchlist"

SHARED_USER_EMAIL = "stress_user@test.com"
SHARED_USER_PASSWORD = "StressPass123"

STRESS_TICKER = "AAPL"

COMPANIES = [
    {"ticker": "AAPL", "cik": 320193},
    {"ticker": "MSFT", "cik": 789019},
    {"ticker": "GOOGL", "cik": 1652044},
    {"ticker": "AMZN", "cik": 1018724},
    {"ticker": "TSLA", "cik": 1318605},
]

SEARCH_QUERIES = ["Apple", "Microsoft", "Amazon", "Tesla", "AAPL", "MSFT", "corp", "tech"]
SUPPORTED_METRICS = ["revenue", "net_income", "eps"]

WHITELIST_SAMPLE = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA",
    "UNH", "JNJ", "XOM", "JPM", "V", "PG", "MA", "HD", "CVX", "MRK",
    "ABBV", "PEP", "KO",
]


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
        self.client.get(
            f"{EDGAR_URL}/search",
            params={"q": "Apple"},
            name="/api/v1/edgar/search [cached]",
        )


class FinancialsBehavior(TaskSet):
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
    @task
    def get_ticker_price(self):
        ticker = random.choice([c["ticker"] for c in COMPANIES])
        self.client.get(
            f"{PRICES_URL}/{ticker}",
            name="/api/v1/prices/{ticker}",
        )

    @task
    def get_last_update(self):
        self.client.get(
            f"{PRICES_URL}/last-update",
            name="/api/v1/prices/last-update",
        )


class PortfolioBehavior(TaskSet):
    token: str = None

    def on_start(self):
        email = f"stress_{uuid.uuid4().hex[:8]}@test.com"
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

    @task(3)
    def get_portfolio(self):
        self.client.get(
            f"{BASE_PORTFOLIO}/",
            headers=self.auth_headers(),
            name="/api/v1/portfolio/ [GET]",
        )

    @task(2)
    def buy_shares(self):
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
    """US-21, US-22, US-23 — agregar, eliminar y ver watchlist"""
    token: str = None

    def on_start(self):
        email = f"stress_{uuid.uuid4().hex[:8]}@test.com"
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

    @task(3)
    def get_watchlist(self):
        """US-23 — ver watchlist con precios"""
        self.client.get(
            f"{BASE_WATCHLIST}/",
            headers=self.auth_headers(),
            name="/api/v1/watchlist/ [GET]",
        )

    @task(4)
    def add_ticker(self):
        """US-21 — agregar empresa a la watchlist"""
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
        """US-22 — eliminar empresa de la watchlist"""
        if not self.added_tickers:
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
        """whitelist pública"""
        self.client.get(
            f"{BASE_WATCHLIST}/whitelist",
            name="/api/v1/watchlist/whitelist",
        )


class WatchlistCompareBehavior(TaskSet):
    """US-24, US-25 — comparar métricas e historial"""
    token: str = None

    def on_start(self):
        email = f"stress_{uuid.uuid4().hex[:8]}@test.com"
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

    @task(3)
    def compare_metrics(self):
        """US-24 — comparar métricas"""
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
        """US-25 — ver evolución histórica"""
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


# ── HttpUser classes ──────────────────────────────────────────────────────────

class RegisterUser(HttpUser):
    tasks = [RegisterBehavior]
    wait_time = between(1, 3)
    weight = 1


class LoginUser(HttpUser):
    tasks = [LoginBehavior]
    wait_time = between(1, 2)
    weight = 3


class SearchUser(HttpUser):
    tasks = [SearchBehavior]
    wait_time = between(2, 4)
    weight = 3


class FinancialsUser(HttpUser):
    tasks = [FinancialsBehavior]
    wait_time = between(2, 5)
    weight = 4


class FilingsUser(HttpUser):
    tasks = [FilingsBehavior]
    wait_time = between(2, 4)
    weight = 3


class MetricsUser(HttpUser):
    tasks = [MetricsBehavior]
    wait_time = between(2, 5)
    weight = 3


class PricesUser(HttpUser):
    tasks = [PricesBehavior]
    wait_time = between(1, 2)
    weight = 2


class PortfolioUser(HttpUser):
    tasks = [PortfolioBehavior]
    wait_time = between(1, 2)
    weight = 5


class WatchlistUser(HttpUser):
    tasks = [WatchlistBehavior]
    wait_time = between(1, 3)
    weight = 5


class WatchlistCompareUser(HttpUser):
    tasks = [WatchlistCompareBehavior]
    wait_time = between(2, 5)
    weight = 3
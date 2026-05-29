import random
import uuid
from locust import HttpUser, task, between, TaskSet


BASE_URL = "/api/v1/auth"
BASE_PORTFOLIO = "/api/v1/portfolio"
BASE_OPERATIONS = "/api/v1/operations"
EDGAR_URL = "/api/v1/edgar"
PRICES_URL = "/api/v1/prices"

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
import uuid
from locust import HttpUser, task, between, TaskSet


BASE_URL = "/api/v1/auth"

SHARED_USER_EMAIL = "stress_user@test.com"
SHARED_USER_PASSWORD = "StressPass123"


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
    @task
    def login(self):
        self.client.post(
            f"{BASE_URL}/login",
            json={"email": SHARED_USER_EMAIL, "password": SHARED_USER_PASSWORD},
            name="/api/v1/auth/login",
        )


class RegisterUser(HttpUser):
    tasks = [RegisterBehavior]
    wait_time = between(1, 3)
    weight = 1


class LoginUser(HttpUser):
    tasks = [LoginBehavior]
    wait_time = between(1, 2)
    weight = 3

BASE_PORTFOLIO = "/api/v1/portfolio"
BASE_OPERATIONS = "/api/v1/operations"
STRESS_TICKER = "AAPL"


class PortfolioBehavior(TaskSet):
    token: str = None

    def on_start(self):
        with self.client.post(
                f"{BASE_URL}/register",
                json={"email": SHARED_USER_EMAIL, "password": SHARED_USER_PASSWORD},
                name="/api/v1/auth/register [setup]",
                catch_response=True,
        ) as resp:
            if resp.status_code in (201, 409):
                resp.success()

        resp = self.client.post(
            f"{BASE_URL}/login",
            json={"email": SHARED_USER_EMAIL, "password": SHARED_USER_PASSWORD},
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


class PortfolioUser(HttpUser):
    tasks = [PortfolioBehavior]
    wait_time = between(1, 2)
    weight = 5
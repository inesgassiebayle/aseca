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


class RegisterUser(HttpUser):
    tasks = [RegisterBehavior]
    wait_time = between(1, 3)
    weight = 1


class LoginUser(HttpUser):
    tasks = [LoginBehavior]
    wait_time = between(1, 2)
    weight = 3
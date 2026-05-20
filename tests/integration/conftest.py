import os
import subprocess
import sys
import time

import httpx
import pytest
from sqlalchemy import create_engine, text

TEST_DB_PATH = "/tmp/aseca_integration_test.db"
TEST_DB_URL = f"sqlite:///{TEST_DB_PATH}"
SERVER_PORT = 9001
SERVER_URL = f"http://127.0.0.1:{SERVER_PORT}"

_UVICORN = os.path.join(os.path.dirname(sys.executable), "uvicorn")


@pytest.fixture(scope="session")
def api_server():
    env = {
        **os.environ,
        "DATABASE_URL": TEST_DB_URL,
        "SECRET_KEY": "integration-test-secret",
    }
    proc = subprocess.Popen(
        [_UVICORN, "app.main:app", "--host", "127.0.0.1", "--port", str(SERVER_PORT)],
        env=env,
    )
    for _ in range(30):
        try:
            r = httpx.get(f"{SERVER_URL}/health", timeout=1)
            if r.status_code == 200:
                break
        except Exception:
            time.sleep(0.5)
    else:
        proc.terminate()
        raise RuntimeError("El servidor no levantó a tiempo")

    yield SERVER_URL

    proc.terminate()
    proc.wait()


@pytest.fixture(autouse=True)
def clean_db(api_server):
    engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    with engine.connect() as conn:
        conn.execute(text("DELETE FROM users"))
        conn.commit()
    engine.dispose()
from threading import Lock
from typing import List

from fastapi import FastAPI, HTTPException
from playwright.sync_api import Cookie
from pydantic import BaseModel

from main import MetroPriceMonitor

app = FastAPI(title="Metro Session Token Service", version="1.0.0")
playwright_lock = Lock()


class LoginRequest(BaseModel):
    username: str
    password: str
    force_refresh: bool = False


class SessionResponse(BaseModel):
    cookies: List[Cookie]


@app.post("/login", response_model=SessionResponse)
def login(request: LoginRequest):
    monitor = MetroPriceMonitor(
        username=request.username,
        password=request.password,
        headless=False  # True scheint die Metro nicht zu mögen
    )

    try:
        monitor.start_browser()

        if monitor.login():
            return SessionResponse(cookies=monitor.get_cookies())

    except Exception as err:
        raise HTTPException(status_code=400, detail=str(err))
    finally:
        monitor.close()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="::",
        port=8000,
        workers=1  # Single-Threaded für Playwright
    )

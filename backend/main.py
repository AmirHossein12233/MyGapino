from pathlib import Path
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles


# =========================================================
# Application
# =========================================================

app = FastAPI(
    title="MyGapino",
    description="MyGapino My Summer Car Online Launcher",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# Project Paths
# =========================================================

# مسیر همین فایل:
# MyGapino/backend/main.py

BACKEND_DIR = Path(__file__).resolve().parent

# یک مرحله بالاتر:
# MyGapino

PROJECT_DIR = BACKEND_DIR.parent

# Frontend:
# MyGapino/frontend

FRONTEND_DIR = PROJECT_DIR / "frontend"


# =========================================================
# Check Frontend
# =========================================================

INDEX_FILE = FRONTEND_DIR / "index.html"

if not FRONTEND_DIR.exists():
    raise RuntimeError(
        f"Frontend directory does not exist: {FRONTEND_DIR}"
    )

if not INDEX_FILE.exists():
    raise RuntimeError(
        f"index.html does not exist: {INDEX_FILE}"
    )


# =========================================================
# Server Information
# =========================================================

server_info = {
    "name": "MyGapino My Summer Car",
    "status": "online",

    # فعلاً موقت است
    # بعداً IP واقعی سرور بازی را قرار می‌دهیم
    "ip": "127.0.0.1",
    "port": 30120,

    "max_players": 32
}


# =========================================================
# Online Players
# =========================================================

players = []


# =========================================================
# Helper
# =========================================================

def current_time():
    return datetime.now(
        timezone.utc
    ).isoformat()


# =========================================================
# Root
# =========================================================

@app.get("/")
async def homepage():

    return FileResponse(
        INDEX_FILE
    )


# =========================================================
# Health API
# =========================================================

@app.get("/api/health")
async def health():

    return {
        "ok": True,
        "service": "MyGapino",
        "status": "online",
        "time": current_time()
    }


# =========================================================
# Server API
# =========================================================

@app.get("/api/server")
async def get_server():

    return {
        "name": server_info["name"],
        "status": server_info["status"],
        "ip": server_info["ip"],
        "port": server_info["port"],
        "players": len(players),
        "max_players": server_info["max_players"]
    }


# =========================================================
# Players API
# =========================================================

@app.get("/api/players")
async def get_players():

    return {
        "count": len(players),
        "players": players
    }


# =========================================================
# Login API
# =========================================================

@app.post("/api/login")
async def login(data: dict):

    username = str(
        data.get("username", "")
    ).strip()


    if not username:

        return {
            "success": False,
            "message": "نام کاربری را وارد کنید."
        }


    if len(username) < 3:

        return {
            "success": False,
            "message": "نام کاربری باید حداقل ۳ کاراکتر باشد."
        }


    if len(username) > 24:

        return {
            "success": False,
            "message": "نام کاربری نباید بیشتر از ۲۴ کاراکتر باشد."
        }


    return {
        "success": True,
        "username": username,
        "message": "ورود موفق بود."
    }


# =========================================================
# Heartbeat API
# =========================================================

@app.post("/api/heartbeat")
async def heartbeat(data: dict):

    username = str(
        data.get("username", "")
    ).strip()


    if not username:

        return {
            "success": False,
            "message": "نام کاربری ارسال نشده است."
        }


    if username not in players:

        players.append(username)


    return {
        "success": True,
        "username": username,
        "players": len(players),
        "server": server_info["name"],
        "time": current_time()
    }


# =========================================================
# Logout API
# =========================================================

@app.post("/api/logout")
async def logout(data: dict):

    username = str(
        data.get("username", "")
    ).strip()


    if username in players:

        players.remove(username)


    return {
        "success": True,
        "players": len(players)
    }


# =========================================================
# Static Frontend Files
# =========================================================

app.mount(
    "/static",
    StaticFiles(
        directory=str(FRONTEND_DIR)
    ),
    name="static"
)

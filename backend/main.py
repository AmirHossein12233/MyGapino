from pathlib import Path
from datetime import datetime, timezone

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles


app = FastAPI(
    title="MyGapino",
    description="MyGapino My Summer Car Online Launcher",
    version="1.2.0"
)


# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mygapino.shop",
        "https://www.mygapino.shop",
        "https://mygapino.onrender.com",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


# =========================
# Paths
# =========================

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BACKEND_DIR.parent
FRONTEND_DIR = PROJECT_DIR / "frontend"
INDEX_FILE = FRONTEND_DIR / "index.html"


if not FRONTEND_DIR.exists():
    raise RuntimeError(
        f"Frontend directory does not exist: {FRONTEND_DIR}"
    )

if not INDEX_FILE.exists():
    raise RuntimeError(
        f"index.html does not exist: {INDEX_FILE}"
    )


# =========================
# My Summer Car Online Server
# =========================

GAME_SERVER_URL = (
    "https://mysummercaronlineserver.onrender.com"
)


server_info = {
    "name": "MyGapino My Summer Car",
    "status": "offline",
    "ip": "mysummercaronlineserver.onrender.com",
    "port": 443,
    "max_players": 32,
}


# =========================
# Local launcher players
# =========================

players = {}


def current_time():
    return datetime.now(timezone.utc)


def current_time_iso():
    return current_time().isoformat()


def cleanup_players():

    now = current_time()

    expired = []

    for username, data in players.items():

        last_seen = data["last_seen"]

        if (now - last_seen).total_seconds() > 30:
            expired.append(username)

    for username in expired:
        players.pop(username, None)


# =========================
# Check real game server
# =========================

async def check_game_server():

    try:

        async with httpx.AsyncClient(
            timeout=8.0,
            follow_redirects=True
        ) as client:

            response = await client.get(
                f"{GAME_SERVER_URL}/health"
            )

            if response.status_code == 200:

                try:
                    data = response.json()
                except Exception:
                    data = {}

                return {
                    "online": True,
                    "status_code": response.status_code,
                    "data": data
                }

            return {
                "online": False,
                "status_code": response.status_code,
                "data": {}
            }

    except Exception as e:

        return {
            "online": False,
            "status_code": 0,
            "data": {},
            "error": str(e)
        }


# =========================
# Security headers
# =========================

@app.middleware("http")
async def security_headers(request: Request, call_next):

    response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"

    response.headers["Referrer-Policy"] = (
        "strict-origin-when-cross-origin"
    )

    response.headers["Permissions-Policy"] = (
        "camera=(), microphone=(), geolocation=()"
    )

    return response


# =========================
# Home
# =========================

@app.get("/")
async def homepage():

    return FileResponse(INDEX_FILE)


@app.head("/")
async def homepage_head():

    return PlainTextResponse(
        "",
        status_code=200
    )


# =========================
# Health
# =========================

@app.get("/api/health")
async def health():

    cleanup_players()

    game = await check_game_server()

    return {
        "ok": True,
        "service": "MyGapino",
        "status": "online",
        "game_server": game["online"],
        "players": len(players),
        "time": current_time_iso()
    }


# =========================
# Server information
# =========================

@app.get("/api/server")
async def get_server():

    cleanup_players()

    game = await check_game_server()

    if game["online"]:

        server_status = "online"

    else:

        server_status = "offline"

    return {
        "name": server_info["name"],
        "status": server_status,
        "ip": server_info["ip"],
        "port": server_info["port"],
        "players": len(players),
        "max_players": server_info["max_players"],
        "game_server": {
            "url": GAME_SERVER_URL,
            "online": game["online"],
            "status_code": game["status_code"]
        }
    }


# =========================
# Players
# =========================

@app.get("/api/players")
async def get_players():

    cleanup_players()

    player_list = []

    for username, data in players.items():

        player_list.append({
            "username": username,
            "last_seen": data["last_seen"].isoformat()
        })

    return {
        "count": len(player_list),
        "players": player_list
    }


# =========================
# Login
# =========================

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


# =========================
# Heartbeat
# =========================

@app.post("/api/heartbeat")
async def heartbeat(data: dict):

    cleanup_players()

    username = str(
        data.get("username", "")
    ).strip()

    if not username:

        return {
            "success": False,
            "message": "نام کاربری ارسال نشده است."
        }

    players[username] = {
        "last_seen": current_time()
    }

    return {
        "success": True,
        "username": username,
        "players": len(players),
        "server": server_info["name"],
        "time": current_time_iso()
    }


# =========================
# Logout
# =========================

@app.post("/api/logout")
async def logout(data: dict):

    username = str(
        data.get("username", "")
    ).strip()

    players.pop(username, None)

    return {
        "success": True,
        "players": len(players)
    }


# =========================
# Robots
# =========================

@app.get("/robots.txt")
async def robots():

    content = """User-agent: *
Disallow: /api/
"""

    return PlainTextResponse(
        content,
        media_type="text/plain"
    )


# =========================
# Static files
# =========================

app.mount(
    "/static",
    StaticFiles(
        directory=str(FRONTEND_DIR)
    ),
    name="static"
)
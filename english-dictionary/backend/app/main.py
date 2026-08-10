from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from app.db import init_db
from app.routers import words, stats, io, ai
from app.seed import seed

app = FastAPI(title="English Dictionary API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(words.router)
app.include_router(stats.router)
app.include_router(io.router)
app.include_router(ai.router)


@app.on_event("startup")
def startup():
    init_db()
    seed()


@app.get("/health")
def health():
    return {"status": "ok"}


# Serve static frontend (all files served directly, SPA fallback to index.html)
FRONTEND_STATIC = Path(__file__).parent.parent.parent / "frontend-static"
if FRONTEND_STATIC.exists():
    app.mount("/vendor", StaticFiles(directory=str(FRONTEND_STATIC / "vendor")), name="vendor")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        candidate = FRONTEND_STATIC / full_path
        if candidate.exists() and candidate.is_file():
            return FileResponse(str(candidate))
        return FileResponse(str(FRONTEND_STATIC / "index.html"))

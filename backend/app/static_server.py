"""Serve the built frontend from FastAPI so we only need one process on port 3003."""
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

FRONTEND_DIST = Path(__file__).parent.parent.parent / "frontend" / "dist"


def mount_static(app):
    if FRONTEND_DIST.exists():
        app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

        @app.get("/{full_path:path}", include_in_schema=False)
        async def serve_spa(full_path: str):
            if full_path.startswith("api"):
                return None
            return FileResponse(str(FRONTEND_DIST / "index.html"))

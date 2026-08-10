# English Dictionary

CEFR A1–C2 vocabulary tracker. Single-user, no login required.

## Stack

- **Backend**: FastAPI + SQLite (WAL + FTS5) + Uvicorn
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + TanStack Query

## Run locally (dev)

**Backend**
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev   # http://localhost:5173 — proxies /api → :8000
```

## Run in production (single process, port 3003)

```bash
cd frontend && npm run build && cd ..
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 3003
```

The FastAPI app serves the built frontend from `frontend/dist/` directly.

## Data

All data lives in `backend/data/dictionary.db` (SQLite, WAL mode).  
**Backup**: copy that one file.  
**Export**: `GET /api/export` returns full JSON.

## Seed data

On first start the database is auto-seeded with ~100 CEFR words.  
To reset and re-seed: `python -m app.seed` (from `backend/`).

# English Dictionary

CEFR A1–C2 vocabulary tracker with a shared dictionary and private learning progress.

## Production architecture

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, and TanStack Query on Cloudflare Pages
- **Backend:** Supabase Auth and Postgres with Row Level Security
- **Owner:** permanent email/password account, presented in the UI as `admin`
- **Guests:** temporary anonymous accounts with isolated progress

The legacy FastAPI/SQLite application remains in `backend/` as source history, but is not used by the production deployment.

## Local development

```bash
cd frontend
cp .env.example .env.local
npm ci
npm run dev
```

See [docs/deployment.md](docs/deployment.md) for Cloudflare and Supabase configuration.

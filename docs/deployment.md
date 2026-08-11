# Cloudflare Pages + Supabase deployment

The production frontend is a static Vite build on Cloudflare Pages. Authentication and all persistent data are provided by Supabase; the legacy FastAPI/SQLite backend is retained only for reference and is not part of the production deployment.

## Cloudflare Pages

- Root directory: `frontend`
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`
- Environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`

The publishable key is safe to expose to the browser. Never add a Supabase service-role key or the owner's password to Cloudflare, source code, or GitHub.

## Supabase

- Email/password login is used for the permanent owner account. The UI maps the public username `admin` to the owner's private email address.
- Anonymous sign-in is enabled for temporary guest access.
- `dictionary_entries` contains the shared dictionary.
- `user_word_state` contains per-user known/unknown and bookmark state.
- Row Level Security is the authorization boundary: authenticated users can read the dictionary, only the owner role can mutate shared entries, and each user can access only their own state.

Apply the SQL files in `supabase/migrations` in order, then load `supabase/seed.sql` for a new project.

## Local verification

```bash
cd frontend
cp .env.example .env.local
npm ci
npm run build
```

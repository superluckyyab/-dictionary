# Cloudflare + Supabase Split Deployment Design

## Goal

Deploy the GitHub repository's current React/Vite interface to Cloudflare Pages while replacing the FastAPI/SQLite runtime with Supabase Database and Auth. Preserve the current visual design and interaction model.

## Hosting Architecture

- Cloudflare Pages hosts only the production build from `frontend/`.
- Supabase provides authentication, shared dictionary data, per-user learning state, and row-level authorization.
- The Python FastAPI/SQLite application remains reference material in the repository but is not required at runtime.
- The frontend uses the Supabase JavaScript SDK directly. No service-role or secret key is exposed to the browser.

## Authentication

- The permanent administrator identity remains tied internally to `superluckyyab@163.com`.
- The login page presents a fixed username, `admin`, plus a password field. The internal email mapping is not shown to the user.
- The user-provided fixed password is stored only by Supabase Auth. It must never appear in committed source, generated bundles, build logs, or Cloudflare public environment variables.
- Anonymous sign-in remains available for temporary trials. Anonymous users are not upgraded and their data may expire with the anonymous account/session.
- The administrator is identified by trusted Supabase `app_metadata.role = 'owner'`, never user-editable metadata.

## Data Model

### Shared dictionary entries

The shared dictionary table stores the current GitHub model:

- word and part of speech
- CEFR level
- phonetic text
- definitions as structured JSON
- audio and external definition URLs
- optional AI explanation
- creation and update timestamps

All authenticated identities, including anonymous identities, may read shared entries. Only the owner may insert, update, delete, or bulk import them.

### Per-user learning state

Each authenticated identity has independent state for each dictionary entry:

- known or unknown status
- bookmarked state
- collection count
- creation and update timestamps

The owner's state is permanent. Anonymous users may read and write only their own temporary state. Anonymous state never changes another user's progress or the shared dictionary.

## Frontend Behavior

The existing GitHub visual styling, layout, typography, colors, and component structure remain unchanged. Data access changes must preserve these visible features:

- full dictionary list and pagination
- word, part-of-speech, and definition search
- CEFR level and initial-letter filters
- known, unknown, and bookmarked tabs
- definition hidden, test, and shown modes
- per-word known and bookmark actions
- add and delete actions for the owner
- JSON and CSV import for the owner
- live summary statistics

Owner-only controls are hidden or disabled for anonymous users. Authentication UI is added without redesigning the dictionary screen.

## Import and Statistics

- JSON and CSV files are parsed in the browser.
- Validated rows are sent to Supabase in bounded batches.
- Duplicate word and part-of-speech pairs increment collection count and bookmark the owner's entry, matching the previous backend behavior.
- Statistics are derived from the shared entries combined with the current user's learning state.

## AI Endpoint Security

The current repository contains a hard-coded third-party AI credential. It must be removed from tracked source. Because the current React interface does not call the AI endpoint, the endpoint is not part of this deployment. If restored later, it must run in a server-side Supabase Edge Function with a rotated secret.

## Deployment

- GitHub `main` is the source of truth.
- Cloudflare Pages builds from `frontend/` using `npm run build` and publishes `frontend/dist`.
- Public Supabase URL and publishable key are supplied as build variables.
- Changes are pushed to GitHub and Cloudflare's Git integration performs the production deployment.
- Supabase authentication redirect URLs retain Cloudflare production and the existing Vercel URL for compatibility.

## Error Handling

- Missing public configuration produces a clear configuration error.
- Authentication failures do not disclose whether the internal administrator email exists.
- Database and import failures show concise user-facing messages and keep existing data unchanged where possible.
- Invalid import rows are rejected before database writes; partial batch failures are reported.

## Verification

- Install dependencies, run lint, tests if present, and a production build.
- Confirm Supabase schema, grants, RLS, owner metadata, and row counts with SQL queries and advisors.
- Verify the Cloudflare deployment is sourced from the expected Git commit.
- Browser-test administrator login, anonymous login, filters, status changes, bookmarks, add/delete, and an import sample.
- Confirm anonymous users cannot mutate shared entries and owner state persists after sign-out and sign-in.
